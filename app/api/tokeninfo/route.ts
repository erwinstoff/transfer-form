import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Standard ERC20 ABI methods we need
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Map supported networks → RPC endpoints (server-side envs)
const NETWORKS: Record<string, string | undefined> = {
  sepolia: process.env.RPC_SEPOLIA,
  ethereum: process.env.RPC_ETHEREUM,
  polygon: process.env.RPC_POLYGON,
  arbitrum: process.env.RPC_ARBITRUM,
  bnb: process.env.RPC_BNB
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

    // Basic address validation
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(owner)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    // Determine spender address (the account that will call transferFrom)
    // Prefer deriving from SPENDER_PRIVATE_KEY; fallback to SPENDER_ADDRESS for legacy setups
    let spenderAddress = process.env.SPENDER_ADDRESS;
    const privateKey = process.env.SPENDER_PRIVATE_KEY;
    if (privateKey) {
      try {
        const tempWallet = new ethers.Wallet(privateKey);
        spenderAddress = tempWallet.address;
      } catch {
        // ignore derivation errors; will validate below
      }
    }
    if (!spenderAddress || !ethers.isAddress(spenderAddress)) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing SPENDER_PRIVATE_KEY or SPENDER_ADDRESS" },
        { status: 500 }
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

    // Fetch allowance (owner → actual spender address)
    const rawAllowance = await token.allowance(owner, spenderAddress);

    const allowance = ethers.formatUnits(rawAllowance, decimals);

    return NextResponse.json({ symbol, allowance });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch token info" },
      { status: 500 }
    );
  }
}
