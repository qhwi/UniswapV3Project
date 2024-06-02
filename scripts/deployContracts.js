const { ContractFactory, utils } = require("ethers");
const WETH9 = require("../utils/WETH9.json");
const fs = require("fs");
const dotenv = require('dotenv');

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NFTPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NFPositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  WETH9,
};

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Link library ${contractName} not found`);
      }
      const address = utils.getAddress(libraries[contractName]).toLowerCase().slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        bytecode = bytecode.slice(0, 2 + start*2) + address + bytecode.slice(2 + start*2 + length*2, bytecode.length);
      });
    });
  });
  return bytecode;
};

async function main() {
  const [owner] = await ethers.getSigners();

  // Deploy the contracts
  Weth = new ContractFactory(artifacts.WETH9.abi, artifacts.WETH9.bytecode, owner);
  wethd = await Weth.deploy();

  Factory = new ContractFactory(artifacts.UniswapV3Factory.abi, artifacts.UniswapV3Factory.bytecode, owner);
  factoryd = await Factory.deploy();

  SwapRouter = new ContractFactory(artifacts.SwapRouter.abi, artifacts.SwapRouter.bytecode, owner);
  swapRtrd = await SwapRouter.deploy(factoryd.address, wethd.address);

  NFTDescriptor = new ContractFactory(artifacts.NFTDescriptor.abi, artifacts.NFTDescriptor.bytecode, owner);
  nftd = await NFTDescriptor.deploy();

  const linkedBc = linkLibraries(
    {
      bytecode: artifacts.NFTPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftd.address,
    }
  );

  NFTPositionDescriptor = new ContractFactory(artifacts.NFTPositionDescriptor.abi, linkedBc, owner);
  nftPosDesd = await NFTPositionDescriptor.deploy(wethd.address, '0x4554480000000000000000000000000000000000000000000000000000000000');

  NFPositionManager = new ContractFactory(artifacts.NFPositionManager.abi, artifacts.NFPositionManager.bytecode, owner);
  nftPosMand = await NFPositionManager.deploy(factoryd.address, wethd.address, nftPosDesd.address);

  // Print the addresses
  let addresses = [
    `WETH_ADDR = ${wethd.address}`,
    `FACTORY_ADDR = ${factoryd.address}`,
    `SWAP_ROUTER_ADDR = ${swapRtrd.address}`,
    `NFT_DESCRIPTOR_ADDR = ${nftd.address}`,
    `POSITION_DESCRIPTOR_ADDR = ${nftPosDesd.address}`,
    `POSITION_MANAGER_ADDR = ${nftPosMand.address}`,
  ];
  for (let address of addresses) {
    console.log(address);
  }

  // Write the addresses to .env file
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', '');
  }
  const envConfig = dotenv.parse(fs.readFileSync('.env'))
  const config = {
    ...envConfig,
    WETH_ADDR: wethd.address,
    FACTORY_ADDR: factoryd.address,
    SWAP_ROUTER_ADDR: swapRtrd.address,
    NFT_DESCRIPTOR_ADDR: nftd.address,
    POSITION_DESCRIPTOR_ADDR: nftPosDesd.address,
    POSITION_MANAGER_ADDR: nftPosMand.address
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
