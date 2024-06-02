const { Contract } = require("ethers")
const WETH9 = require("../utils/WETH9.json")
const { getBalance, toEth } = require('./utility')

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
  console.error("! ERROR: Please run 'deployContracts.js', 'deployTokens.js' first.")
  process.exit(1)
}


async function main() {
  const [owner, signer2] = await ethers.getSigners();
  
  // Print the before balances
  console.log('>>> BEFORE')
  const [usdtBalBefore, usdcBalBefore] = await getBalance(signer2)
  
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
  const [usdtBalAfter, usdcBalAfter] = await getBalance(signer2)
  console.log('> Profit')
  console.log('USDT +', toEth(usdtBalAfter.sub(usdtBalBefore).toString()))
  console.log('USDC +', toEth(usdcBalAfter.sub(usdcBalBefore).toString()))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 