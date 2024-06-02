const artifacts = {
  NFPositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/coin/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/coin/UsdCoin.sol/UsdCoin.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

const { Contract, BigNumber } = require("ethers")
const { Token } = require('@uniswap/sdk-core')
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')

// Load the .env file
WETH_ADDR= process.env.WETH_ADDR
FACTORY_ADDR= process.env.FACTORY_ADDR
SWAP_ROUTER_ADDR= process.env.SWAP_ROUTER_ADDR
NFT_DESCRIPTOR_ADDR= process.env.NFT_DESCRIPTOR_ADDR
POSITION_DESCRIPTOR_ADDR= process.env.POSITION_DESCRIPTOR_ADDR
POSITION_MANAGER_ADDR= process.env.POSITION_MANAGER_ADDR

TETHER_ADDR= process.env.TETHER_ADDR
USDC_ADDR= process.env.USDC_ADDR

USDT_USDC_500= process.env.USDT_USDC_500
USDT_USDC_3000= process.env.USDT_USDC_3000
USDT_USDC_10000= process.env.USDT_USDC_10000
POOL_ADDRS = [USDT_USDC_500, USDT_USDC_3000, USDT_USDC_10000]

if (!WETH_ADDR || !FACTORY_ADDR || !SWAP_ROUTER_ADDR || !NFT_DESCRIPTOR_ADDR || !POSITION_DESCRIPTOR_ADDR || !POSITION_MANAGER_ADDR || !TETHER_ADDR || !USDC_ADDR || !USDT_USDC_500 || !USDT_USDC_3000 || !USDT_USDC_10000) {
  console.error("! ERROR: Please run all deploy scripts first.")
  process.exit(1)
}

// Helper function to get pool data
async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  const sqrtPriceX96 = slot0[0]
  const numerator = BigNumber.from(sqrtPriceX96).pow(2)
  const denominator = BigNumber.from(2).pow(192)
  const priceRatio = numerator/denominator

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceRatio: priceRatio.toString(),
    tick: slot0[1],
  }
}

// Config
LIQUIDITY = ethers.utils.parseEther('100')
DEADLINE = Math.floor(Date.now() / 1000) + (60 * 10)

async function main() {
  const [owner, signer2] = await ethers.getSigners();
  const provider = waffle.provider;

  const nfPositionManager = new Contract(
    POSITION_MANAGER_ADDR,
    artifacts.NFPositionManager.abi,
    provider
  )
  const usdtContract = new Contract(TETHER_ADDR,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDR,artifacts.Usdc.abi,provider)

  await usdtContract.connect(owner).approve(POSITION_MANAGER_ADDR, ethers.utils.parseEther('9999999'))
  await usdcContract.connect(owner).approve(POSITION_MANAGER_ADDR, ethers.utils.parseEther('9999999'))

  const UsdtToken = new Token(31337, TETHER_ADDR, 18, 'USDT', 'Tether')
  const UsdcToken = new Token(31337, USDC_ADDR, 18, 'USDC', 'UsdCoin')

  // Create contract objects for each pool
  const poolData = {}
  for (const poolAddress of POOL_ADDRS) {
    const poolContract = new Contract(poolAddress, artifacts.UniswapV3Pool.abi, provider)
    poolData[poolAddress] = await getPoolData(poolContract)
  }

  const mintParams = {}
  POOL_ADDRS.map(async poolAddress => {
    pd = poolData[poolAddress]

    const poolObj = new Pool(
      UsdtToken,
      UsdcToken,
      pd.fee,
      pd.sqrtPriceX96,
      pd.liquidity,
      pd.tick
    )

    const tickLower = nearestUsableTick(pd.tick, pd.tickSpacing) - pd.tickSpacing * 100
    const tickUpper = nearestUsableTick(pd.tick, pd.tickSpacing) + pd.tickSpacing * 100

    const positionObj = new Position({
      pool: poolObj,
      liquidity: LIQUIDITY,
      tickLower: tickLower,
      tickUpper: tickUpper,
    })

    const { amount0: amount0Desired, amount1: amount1Desired} = positionObj.mintAmounts
    const params = {
      token0: TETHER_ADDR,
      token1: USDC_ADDR,
      fee: pd.fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired.toString(),
      amount1Desired: amount1Desired.toString(),
      amount0Min: 0,
      amount1Min: 0,
      recipient: signer2.address,
      deadline: DEADLINE
    }

    mintParams[poolAddress] = params
  })

  // Mint the positions
  for (const poolAddress of POOL_ADDRS) {
    const tx = await nfPositionManager.connect(owner).mint(mintParams[poolAddress], { gasLimit: '1000000' })
    await tx.wait()
  }

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