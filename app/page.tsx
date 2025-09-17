'use client';
import { useState } from 'react';

export default function Home() {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [owner, setOwner] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('sepolia');
  const [approved, setApproved] = useState('');
  const [status, setStatus] = useState('');

  async function fetchTokenMetaAndAllowance(tokenSymbol: string, net: string, ownerAddr: string) {
    try {
      const res = await fetch('/api/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, network: net, owner: ownerAddr })
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setApproved(data.allowance || '0');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  async function handleTransfer() {
    setStatus('⏳ Processing...');
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, owner, amount, network })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ Tx sent: ${data.hash}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f2f] text-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">ERC-20 Token Transfer (via Allowance)</h1>

      {tokenSymbol && <h2 className="text-xl mb-2">Selected Token: {tokenSymbol}</h2>}
      {approved && <p className="mb-4">✅ Approved Allowance: {approved}</p>}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <select
          value={tokenSymbol}
          onChange={e => {
            setTokenSymbol(e.target.value);
            if (owner) fetchTokenMetaAndAllowance(e.target.value, network, owner);
          }}
          className="w-full rounded-lg border border-gray-600 bg-[#1c1c3a] px-3 py-2 text-white focus:outline-none"
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
            if (tokenSymbol) fetchTokenMetaAndAllowance(tokenSymbol, network, e.target.value);
          }}
          className="w-full rounded-lg border border-gray-600 bg-[#1c1c3a] px-3 py-2 text-white focus:outline-none"
        />

        <input
          type="text"
          placeholder="Amount to Transfer"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-[#1c1c3a] px-3 py-2 text-white focus:outline-none"
        />

        <select
          value={network}
          onChange={e => {
            setNetwork(e.target.value);
            if (tokenSymbol && owner) fetchTokenMetaAndAllowance(tokenSymbol, e.target.value, owner);
          }}
          className="w-full rounded-lg border border-gray-600 bg-[#1c1c3a] px-3 py-2 text-white focus:outline-none"
        >
          <option value="sepolia">Sepolia</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="bnb">BNB Chain</option>
        </select>

        <button
          onClick={handleTransfer}
          className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white py-2 font-semibold transition"
        >
          Transfer
        </button>
      </div>

      <div className="mt-4 w-full max-w-sm rounded-lg bg-[#1c1c3a] px-4 py-3 text-center">
        {status}
      </div>
    </div>
  );
}