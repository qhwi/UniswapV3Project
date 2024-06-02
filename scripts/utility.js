const { Contract, BigNumber } = require("ethers")
const artifacts = {
    Usdt: require("../artifacts/contracts/coin/Tether.sol/Tether.json"),
    Usdc: require("../artifacts/contracts/coin/UsdCoin.sol/UsdCoin.json")
  };

  TETHER_ADDR= process.env.TETHER_ADDR
  USDC_ADDR= process.env.USDC_ADDR

exports.toEth = (wei) => ethers.utils.formatEther(wei)
exports.getBalance = async (signer) => {
  const toEth = (wei) => ethers.utils.formatEther(wei)
  const provider = waffle.provider;
  const usdtContract = new Contract(TETHER_ADDR,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDR,artifacts.Usdc.abi,provider)

  let usdtBalance = await usdtContract.connect(provider).balanceOf(signer.address)
  let usdcBalance = await usdcContract.connect(provider).balanceOf(signer.address)
  console.log('USDT', toEth(usdtBalance.toString()))
  console.log('USDC', toEth(usdcBalance.toString()))
  return [usdtBalance, usdcBalance]
}

exports.getPoolImmutables = async (poolContract) => {
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee()
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee
    }
    return immutables
  }
  

  exports.getPoolData = async (poolContract) => {
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

