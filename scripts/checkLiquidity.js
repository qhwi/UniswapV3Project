const { Contract } = require("ethers")
const { getPoolData } = require('./utility')

const artifacts = {
  NFPositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/coin/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/coin/UsdCoin.sol/UsdCoin.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

// Load the .env file
USDT_USDC_500= process.env.USDT_USDC_500
USDT_USDC_3000= process.env.USDT_USDC_3000
USDT_USDC_10000= process.env.USDT_USDC_10000
POOL_ADDRS = [USDT_USDC_500, USDT_USDC_3000, USDT_USDC_10000]

if (!USDT_USDC_500 || !USDT_USDC_3000 || !USDT_USDC_10000) {
  console.error("! ERROR: Please run all deploy scripts first.")
  process.exit(1)
}

async function main() {
  const provider = waffle.provider;

  // Print the after pool data
  for (const poolAddress of POOL_ADDRS) {
    const poolContract = new Contract(poolAddress, artifacts.UniswapV3Pool.abi, provider)
    const poolData = await getPoolData(poolContract)
    console.log(`> Pool ${poolAddress}`, poolData)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });