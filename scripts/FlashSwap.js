const { Contract } = require("ethers")
const WETH9 = require("../utils/WETH9.json")

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NFTPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NFPositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/coin/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/coin/UsdCoin.sol/UsdCoin.json"),
  WETH9,
};

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

// Helper function to get balance
const toEth = (wei) => ethers.utils.formatEther(wei)
async function getBalance(signer) {
  const provider = waffle.provider;
  const usdtContract = new Contract(TETHER_ADDR,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDR,artifacts.Usdc.abi,provider)

  let usdtBalance = await usdtContract.connect(provider).balanceOf(signer.address)
  let usdcBalance = await usdcContract.connect(provider).balanceOf(signer.address)
  console.log('USDT', toEth(usdtBalance.toString()))
  console.log('USDC', toEth(usdcBalance.toString()))
}

async function main() {
  const [owner, signer2] = await ethers.getSigners();
  
  // Print the before balances
  console.log('>>> BEFORE')
  await getBalance(signer2)
  
  // Deploy the flash swap contract
  Flash = await ethers.getContractFactory('UniswapV3FlashSwap', signer2);
  flashd = await Flash.deploy(SWAP_ROUTER_ADDR, FACTORY_ADDR, WETH_ADDR);
  console.log('> FlashSwap', flashd.address)

  const tx = await flashd.connect(signer2).initFlash(
    [
      TETHER_ADDR,
      USDC_ADDR,
      500,
      ethers.utils.parseEther('1'),
      ethers.utils.parseEther('1'),
      3000,
      10000
    ],
    { gasLimit: ethers.utils.hexlify(1000000) }
  );
  await tx.wait()

  // Print the after balances
  console.log('>>> AFTER')
  await getBalance(signer2)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 