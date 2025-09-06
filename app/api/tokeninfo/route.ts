import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Standard ERC20 ABI methods we need
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Map supported networks → RPC endpoints
const NETWORKS: Record<string, string | undefined> = {
  sepolia: process.env.NEXT_PUBLIC_RPC_SEPOLIA,
  ethereum: process.env.NEXT_PUBLIC_RPC_ETHEREUM,
  polygon: process.env.NEXT_PUBLIC_RPC_POLYGON,
  arbitrum: process.env.NEXT_PUBLIC_RPC_ARBITRUM,
  bnb: process.env.NEXT_PUBLIC_RPC_BNB
};

export async function POST(req: Request) {
  try {
    const { tokenAddress, owner, network } = await req.json();
    if (!tokenAddress || !owner || !network) {
      return NextResponse.json(
        { error: "Missing parameters: tokenAddress, owner, network required" },
        { status: 400 }
      );
    }

    const rpcUrl = NETWORKS[network];
    if (!rpcUrl) {
      return NextResponse.json(
        { error: `Unsupported network: ${network}` },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Fetch token symbol + decimals
    const [symbol, decimals] = await Promise.all([
      token.symbol(),
      token.decimals()
    ]);

    // Fetch allowance (owner → spender)
    const spender = process.env.SPENDER_ADDRESS!;
    const rawAllowance = await token.allowance(owner, spender);

    const allowance = ethers.formatUnits(rawAllowance, decimals);

    return NextResponse.json({ symbol, allowance });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch token info" },
      { status: 500 }
    );
  }
}
