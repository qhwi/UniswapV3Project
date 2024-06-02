const { ethers } = require("hardhat");
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;
const SwapRouterABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json').abi;
const ERC20ABI = require('../utils/ERC20.json'); 
const { getPoolImmutables, getBalance, toEth } = require('./utility')

USDT_USDC_500= process.env.USDT_USDC_500
SWAP_ROUTER_ADDR= process.env.SWAP_ROUTER_ADDR
TETHER_ADDR= process.env.TETHER_ADDR
USDC_ADDR= process.env.USDC_ADDR

async function main() {
    const [owner, signer2] = await ethers.getSigners();
    const provider = waffle.provider;

    const poolContract = new ethers.Contract(USDT_USDC_500, IUniswapV3PoolABI, provider);
    const swapRouterContract = new ethers.Contract(SWAP_ROUTER_ADDR, SwapRouterABI, provider);

    const amountIn = ethers.utils.parseUnits("1", 18);
    const approvalAmount = amountIn.mul(100000);
    const tokenContract0 = new ethers.Contract(TETHER_ADDR, ERC20ABI, provider);
    const tokenContract1 = new ethers.Contract(USDC_ADDR, ERC20ABI, provider);

    await tokenContract0.connect(signer2).approve(SWAP_ROUTER_ADDR, approvalAmount);
    await tokenContract1.connect(signer2).approve(SWAP_ROUTER_ADDR, approvalAmount);

    // Set up swap parameters
    const immutables = await getPoolImmutables(poolContract);

    const params = {
        tokenIn: immutables.token0,
        tokenOut: immutables.token1,
        fee: 500,
        recipient: signer2.address,
        deadline: Math.floor(Date.now() / 1000) + (60 * 10),
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };

    // Print the before balances
    console.log('>>> BEFORE')
    const [usdtBalBefore, usdcBalBefore] = await getBalance(signer2)
    if (usdtBalBefore.lt(amountIn)) {
        console.error('! ERROR: Insufficient USDT balance')
        process.exit(1)
    }

    const transaction = await swapRouterContract.connect(signer2).exactInputSingle(params, {
        gasLimit: ethers.utils.hexlify(1000000)
    });

    console.log(`Transaction hash: ${transaction.hash}`);
    const receipt = await transaction.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // Print the after balances
    console.log('>>> AFTER')
    const [usdtBalAfter, usdcBalAfter] = await getBalance(signer2)
    console.log('> Change')
    console.log('USDT - 1')
    console.log('USDC +', toEth(usdcBalAfter.sub(usdcBalBefore).toString()))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });