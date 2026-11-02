const palette = [
  '#f4a340','#a69cff','#55e3b5','#d9e9e2','#4e92fa','#f3d453','#ef6573','#fb75ad','#f1c94a','#b883ef',
  '#58b8ee','#ee7195','#39a0ff','#8c7ae6','#e84142','#2a5ada','#00a4e4','#22c55e','#f97316','#14b8a6',
  '#eab308','#a855f7','#ec4899','#06b6d4','#84cc16','#f43f5e','#6366f1','#10b981','#f59e0b','#0ea5e9',
];

// 100-token stable roster. Group sizes intentionally match the 4/4/4 race mix.
const stars = [
  ['BTC','Bitcoin','#f7931a'], ['ETH','Ethereum','#627eea'], ['SOL','Solana','#9945ff'], ['BNB','BNB','#f0b90b'],
  ['XRP','XRP','#27a2db'], ['DOGE','Dogecoin','#c2a633'], ['LINK','Chainlink','#2a5ada'], ['ADA','Cardano','#0033ad'],
];
const core = [
  ['TRX','TRON','#eb0029'],['ZEC','Zcash','#f4b728'],['HYPE','Hyperliquid','#4a6cff'],['XMR','Monero','#ff6600'],
  ['WBT','WhiteBIT Coin','#f4f4f5'],['XLM','Stellar','#08b5e5'],['BCH','Bitcoin Cash','#8dc351'],['LTC','Litecoin','#345d9d'],
  ['SUI','Sui','#6fbcf0'],['AVAX','Avalanche','#e84142'],['TON','Toncoin','#0098ea'],['SHIB','Shiba Inu','#f00500'],
  ['DOT','Polkadot','#e6007a'],['CRO','Cronos','#002d74'],['NEAR','NEAR Protocol','#00c08b'],['AAVE','Aave','#b6509e'],
  ['UNI','Uniswap','#ff007a'],['TAO','Bittensor','#000000'],['ICP','Internet Computer','#3b00b9'],['ONDO','Ondo','#7d5fff'],
  ['ETC','Ethereum Classic','#328332'],['POL','POL (ex-MATIC)','#8247e5'],['RENDER','Render','#e34f26'],['FIL','Filecoin','#0090ff'],
];
const challengers = [
  ['ARB','Arbitrum','#28a0f0'],['OP','Optimism','#ff0420'],['INJ','Injective','#00f2ea'],['ATOM','Cosmos','#6f7390'],
  ['FET','Artificial Superintelligence Alliance','#1c1c1c'],['QNT','Quant','#264b9b'],['ALGO','Algorand','#111111'],['VET','VeChain','#15bdff'],
  ['KAS','Kaspa','#70c7ba'],['SEI','Sei','#9b1c2d'],['TIA','Celestia','#7b2bf9'],['PENGU','Pudgy Penguins','#8c6bff'],
  ['BONK','Bonk','#f5a623'],['PEPE','Pepe','#4d9b45'],['WIF','dogwifhat','#b78b59'],['FLOKI','Floki','#f39c12'],
  ['GRT','The Graph','#6747ed'],['CRV','Curve DAO','#f04e5e'],['SKY','Sky','#2e9d8f'],['LDO','Lido DAO','#00a3ff'],
  ['JUP','Jupiter','#c8a2ff'],['PYTH','Pyth Network','#6c45f5'],['ENA','Ethena','#111111'],['IMX','Immutable','#16b8a6'],
  ['MANA','Decentraland','#ff2d55'],['SAND','The Sandbox','#00aef0'],['AXS','Axie Infinity','#0055d4'],['GALA','Gala','#2c2c2c'],
  ['CHZ','Chiliz','#cd0124'],['APT','Aptos','#5b5b5b'],['STX','Stacks','#5546ff'],['RUNE','THORChain','#00cc99'],
  ['THETA','Theta Network','#2ab8e6'],['EGLD','MultiversX','#23f7dd'],['XTZ','Tezos','#2c7df7'],['XDC','XDC Network','#2047a8'],
  ['KCS','KuCoin Token','#23af91'],['OKB','OKB','#111111'],['GT','GateToken','#2354e6'],['BGB','Bitget Token','#00f0ff'],
  ['MNT','Mantle','#00bfb3'],['KAVA','Kava','#ff564f'],['COMP','Compound','#00d395'],['SNX','Synthetix','#00d1ff'],
  ['1INCH','1inch','#1b314f'],['ENS','Ethereum Name Service','#5298ff'],['ZRO','LayerZero','#ffffff'],['STRK','Starknet','#ec796b'],
  ['ZK','ZKsync','#8c8dfc'],['EIGEN','EigenLayer','#111111'],['WLD','Worldcoin','#f2f2f2'],['AR','Arweave','#222326'],
  ['ROSE','Oasis','#96d531'],['MINA','Mina Protocol','#e5e5e5'],['OSMO','Osmosis','#5e43d9'],['LPT','Livepeer','#00eb88'],
  ['ZIL','Zilliqa','#49c1bf'],['BAT','Basic Attention Token','#ff5000'],['IOTA','IOTA','#131f37'],['SUSHI','Sushi','#fa52a0'],
  ['CAKE','PancakeSwap','#d1884f'],['DASH','Dash','#008de4'],['NEO','Neo','#00e599'],['FLOW','Flow','#00ef8b'],
  ['KSM','Kusama','#000000'],['ENJ','Enjin Coin','#7866d5'],['GNO','Gnosis','#04795b'],['RAY','Raydium','#5ac4be'],
];

const toRunner = ([symbol, name, color], tier, index) => ({
  symbol, name, color: color || palette[index % palette.length],
  coat: ['#574b46','#684f42','#4b5058','#76604f','#49433f','#69564d'][index % 6],
  tier,
  // Within each class, the first few legacy favorites keep a little extra airtime.
  weight: tier === 'star' ? [5,4.5,4,3.5,2.5,2,1.7,1.5][index] : tier === 'core' ? 1.15 : 1,
});

export const TOKEN_ROSTER = [
  ...stars.map((row, i) => toRunner(row, 'star', i)),
  ...core.map((row, i) => toRunner(row, 'core', i)),
  ...challengers.map((row, i) => toRunner(row, 'challenger', i)),
];

if (TOKEN_ROSTER.length !== 100 || new Set(TOKEN_ROSTER.map(({symbol}) => symbol)).size !== 100) {
  throw new Error(`Token roster must contain 100 unique assets; got ${TOKEN_ROSTER.length}`);
}
