const fs = require("fs");
const dotenv = require('dotenv');

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NFPositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract, BigNumber } = require("ethers")
const bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

// Load the .env file
WETH_ADDR= process.env.WETH_ADDR
FACTORY_ADDR= process.env.FACTORY_ADDR
SWAP_ROUTER_ADDR= process.env.SWAP_ROUTER_ADDR
NFT_DESCRIPTOR_ADDR= process.env.NFT_DESCRIPTOR_ADDR
POSITION_DESCRIPTOR_ADDR= process.env.POSITION_DESCRIPTOR_ADDR
POSITION_MANAGER_ADDR= process.env.POSITION_MANAGER_ADDR

TETHER_ADDR= process.env.TETHER_ADDR
USDC_ADDR= process.env.USDC_ADDR

if (!WETH_ADDR || !FACTORY_ADDR || !SWAP_ROUTER_ADDR || !NFT_DESCRIPTOR_ADDR || !POSITION_DESCRIPTOR_ADDR || !POSITION_MANAGER_ADDR || !TETHER_ADDR || !USDC_ADDR) {
  console.error("! ERROR: Please run 'deploy.js', 'deployTokens.js' first.")
  process.exit(1)
}

// Helper function to encode price
function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}

const provider = waffle.provider;

const nfPositionManager = new Contract(
  POSITION_MANAGER_ADDR,
  artifacts.NFPositionManager.abi,
  provider
)
const factory = new Contract(
  FACTORY_ADDR,
  artifacts.UniswapV3Factory.abi,
  provider
)

async function deployPool(token0, token1, fee, price) {
  const [owner] = await ethers.getSigners();
  await nfPositionManager.connect(owner).createAndInitializePoolIfNecessary(
    token0,
    token1,
    fee,
    price,
    { gasLimit: 5000000 }
  )
  const poolAddress = await factory.connect(owner).getPool(
    token0,
    token1,
    fee,
  )
  return poolAddress
}


async function main() {
  // Deploy Pools
  const pool500 = await deployPool(TETHER_ADDR, USDC_ADDR, 500, encodePriceSqrt(1, 1))
  const pool3000 = await deployPool(TETHER_ADDR, USDC_ADDR, 3000, encodePriceSqrt(1, 2))
  const pool10000 = await deployPool(TETHER_ADDR, USDC_ADDR, 10000, encodePriceSqrt(2, 1))

  // Write pool addresses to .env file
  console.log('USDT_USDC_500 =', `${pool500}`)
  console.log('USDT_USDC_3000 =', `${pool3000}`)
  console.log('USDT_USDC_10000 =', `${pool10000}`)

  const envConfig = dotenv.parse(fs.readFileSync('.env'))
    const config = {
      ...envConfig,
      USDT_USDC_500: pool500,
      USDT_USDC_3000: pool3000,
      USDT_USDC_10000: pool10000
    };
    const env = Object.entries(config).map(
      ([key, value]) => `${key} = ${value}`
    ).join('\n');
    fs.writeFileSync('.env', env);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });