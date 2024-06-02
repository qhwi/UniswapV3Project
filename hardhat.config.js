const fs = require("fs");
// Write if file .env not exists
if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", "");
}
dotenv = require("dotenv")
dotenv.config();

// Replace old variables with "null" in .env if they exist

if (process.argv[2] === "node") {
  const envVariables = [
    "WETH_ADDR",
    "FACTORY_ADDR",
    "SWAP_ROUTER_ADDR",
    "NFT_DESCRIPTOR_ADDR",
    "POSITION_DESCRIPTOR_ADDR",
    "POSITION_MANAGER_ADDR",
    "TETHER_ADDR",
    "USDC_ADDR",
    "DAI_ADDR",
    "USDT_USDC_500",
    "USDT_USDC_3000",
    "USDT_USDC_10000"
  ];
  
  const envConfig = dotenv.parse(fs.readFileSync('.env'))
  envVariables.forEach((evar) => {
    if (envConfig[evar]) {
      delete envConfig[evar];
    }
  });
  const env = Object.entries(envConfig).map(
    ([key, value]) => `${key} = ${value}`
  ).join('\n');
  fs.writeFileSync('.env', env);
}

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    compilers: [
      { version: "0.7.6" }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 5000,
        details: { yul: false }
      }
    }
  }
};