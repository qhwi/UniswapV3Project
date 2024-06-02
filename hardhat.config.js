const fs = require("fs");
// Write if file .env not exists
if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", "");
}

require("dotenv").config();
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