import { NextResponse } from 'next/server';

export async function GET() {
	// Return configured RPC endpoints (safe to expose in dev; in prod consider restricting)
	return NextResponse.json({
		sepolia: process.env.RPC_SEPOLIA ?? null,
		ethereum: process.env.RPC_ETHEREUM ?? null,
		polygon: process.env.RPC_POLYGON ?? null,
		arbitrum: process.env.RPC_ARBITRUM ?? null,
		bnb: process.env.RPC_BNB ?? null,
		base: process.env.RPC_BASE ?? null
	});
}

export async function POST() {
	return NextResponse.json({ success: true });
}
