const fs = require("fs");
const dotenv = require('dotenv');

async function main() {
    const [owner] = await ethers.getSigners();
  
    // Deploy the token contracts
    Tether = await ethers.getContractFactory('Tether', owner);
    tetherd = await Tether.deploy();
  
    Usdc = await ethers.getContractFactory('UsdCoin', owner);
    usdcd = await Usdc.deploy();

    Dai = await ethers.getContractFactory('Dai', owner);
    daid = await Dai.deploy();
  
    // Mint tokens
    await tetherd.connect(owner).mint(
      owner.address,
      ethers.utils.parseEther('100000')
    )
    await usdcd.connect(owner).mint(
      owner.address,
      ethers.utils.parseEther('100000')
    )
    await daid.connect(owner).mint(
      owner.address,
      ethers.utils.parseEther('100000')
    )
  
    // Write token addresses to .env file
    console.log('TETHER_ADDR =', `${tetherd.address}`)
    console.log('USDC_ADDR =', `${usdcd.address}`)
    console.log('DAI_ADDR =', `${daid.address}`)

    const envConfig = dotenv.parse(fs.readFileSync('.env'))
    const config = {
      ...envConfig,
      TETHER_ADDR: tetherd.address,
      USDC_ADDR: usdcd.address,
      DAI_ADDR: daid.address
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