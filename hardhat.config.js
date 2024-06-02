const fs = require("fs");
// Write if file .env not exists
if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", "");
}
dotenv = require("dotenv")
dotenv.config();

// Replace old variables with "null" in .env if they exist
const envVariables = [
  "WETH_ADDR",
  "FACTORY_ADDR",
  "SWAP_ROUTER_ADDR",
  "NFT_DESCRIPTOR_ADDR",
  "POSITION_DESCRIPTOR_ADDR",
  "POSITION_MANAGER_ADDR",
  "TETHER_ADDR",
  "USDC_ADDR"
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