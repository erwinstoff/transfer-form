'use client';
import { useState, useMemo, useEffect } from 'react';

// A new component to format and display the allowance status
const AllowanceStatus = ({ approved }: { approved: string }) => {
  if (!approved) return null;

  let displayValue = approved;
  let isMax = approved.toLowerCase() === 'max';

  if (!isMax) {
    try {
      const num = parseFloat(approved);
      // If the number is extremely large, treat it as 'Max' for readability
      if (num > 1e18) {
        isMax = true;
      } else {
        // Format to a reasonable number of decimal places
        displayValue = num.toLocaleString(undefined, { maximumFractionDigits: 4 });
      }
    } catch (e) {
      // If parsing fails, just show the original string
      console.error("Could not parse allowance value:", approved);
    }
  }

  const text = isMax ? 'Max' : displayValue;
  const statusText = isMax || parseFloat(approved) > 0 ? 'Approved' : 'Not Approved';

  return (
    <p className="text-center text-green-400">
      ✅ {statusText}: [{text}]
    </p>
  );
};

export default function Home() {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [owner, setOwner] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('sepolia');
  const [approved, setApproved] = useState('');
  const [balance, setBalance] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    // Only auto-clear error messages. Success messages should persist.
    if (status.type === 'error') {
      const timer = setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
      }, 5000); // Clear status after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  async function fetchTokenMetaAndAllowance(tokenSymbol: string, net: string, ownerAddr: string) {
    setApproved('');
    setBalance('');
    if (!tokenSymbol || !ownerAddr) return;

    try {
      const res = await fetch('/api/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, network: net, owner: ownerAddr })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }
      const data = await res.json();
      setApproved(data.allowance || '0');
      setBalance(data.balance || '0');
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to fetch token info.', details: err.message });
    }
  }

  async function handleTransfer() {
    setStatus({ type: 'processing', message: 'Processing transaction...' });
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, owner, amount, network })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: 'Transaction sent successfully!', details: data.txHash });
        // Refresh balance after successful transfer
        fetchTokenMetaAndAllowance(tokenSymbol, network, owner);
      } else {
        setStatus({ type: 'error', message: 'Transaction failed.', details: data.error });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.', details: err.message });
    }
  }

  const networkExplorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    sepolia: 'https://sepolia.etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    bnb: 'https://bscscan.com/tx/',
  };

  const statusUI = useMemo(() => {
    if (status.type === 'idle') return null;

    const baseClasses = "mt-6 w-full max-w-md rounded-lg px-4 py-3 text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-3";
    let specificClasses = '';
    let icon = '';
    let content = (
      <div className="text-left">
        <p className="font-semibold">{status.message}</p>
        {status.details && <p className="text-sm text-gray-400 break-all">{status.details}</p>}
      </div>
    );

    switch (status.type) {
      case 'processing':
        specificClasses = 'bg-blue-900/50 border border-blue-700 text-blue-200 animate-pulse';
        icon = '⏳';
        break;
      case 'success':
        specificClasses = 'bg-green-900/50 border border-green-700 text-green-200';
        icon = '✅';
        if (status.details) {
          const explorerUrl = networkExplorers[network];
          content = (
            <div className="text-left">
              <p className="font-semibold">{status.message}</p>
              {explorerUrl ? (
                <a
                  href={`${explorerUrl}${status.details}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:underline break-all"
                >
                  View transaction
                </a>
              ) : (
                <p className="text-sm text-gray-400 break-all">{status.details}</p>
              )}
            </div>
          );
        }
        break;
      case 'error':
        specificClasses = 'bg-red-900/50 border border-red-700 text-red-200';
        icon = '❌';
        break;
    }

    return (
      <div className={`${baseClasses} ${specificClasses}`}>
        <span className="text-2xl">{icon}</span>
        {content}
      </div>
    );
  }, [status, network]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <header className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-center text-white">Token Transfer</h1>
        <p className="text-center text-gray-400">A secure and easy way to transfer your ERC-20 tokens.</p>
      </header>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transform transition-all hover:scale-105">
        <div className="space-y-2">
          {tokenSymbol && <h2 className="text-xl font-semibold text-center">Selected Token: {tokenSymbol}</h2>}
          {balance && <p className="text-center text-gray-400">Your Balance: {balance} {tokenSymbol}</p>}
          <AllowanceStatus approved={approved} />
        </div>

        <div className="flex flex-col gap-4">
          <select
            value={tokenSymbol}
            onChange={e => {
              setTokenSymbol(e.target.value);
              fetchTokenMetaAndAllowance(e.target.value, network, owner);
            }}
            className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">Select Token</option>
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
            <option value="WETH">WETH</option>
            <option value="DAI">DAI</option>
            <option value="UNI">UNI</option>
            <option value="LINK">LINK</option>
            <option value="WBTC">WBTC</option>
            <option value="WMATIC">WMATIC</option>
            <option value="ARB">ARB</option>
            <option value="WBNB">WBNB</option>
            <option value="BUSD">BUSD</option>
          </select>

          <input
            type="text"
            placeholder="Owner Address (who approved)"
            value={owner}
            onChange={e => {
              setOwner(e.target.value);
              fetchTokenMetaAndAllowance(tokenSymbol, network, e.target.value);
            }}
            className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
          />

          <input
            type="text"
            placeholder="Amount to Transfer"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
          />

          <select
            value={network}
            onChange={e => {
              setNetwork(e.target.value);
              fetchTokenMetaAndAllowance(tokenSymbol, e.target.value, owner);
            }}
            className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
          >
            <option value="sepolia">Sepolia</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="bnb">BNB Chain</option>
          </select>

          <button
            onClick={handleTransfer}
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 text-white py-3 font-semibold transition transform hover:scale-105"
          >
            Transfer
          </button>
        </div>
      </div>

      {statusUI}
    </div>
  );
}