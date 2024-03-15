require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv")
dotenv.config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    mumbai: {
      url: process.env.MUMBAI_URL,
      chainId: 80001,
      accounts: [process.env.PRIVATE_KEY1],
      },
    localhost:{
    url:"http://127.0.0.1:8545/",
    chainId: 31337,
    accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80","0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d","0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"]
    // ALWAYS RUN "npx hardhat node" parallely and the above private key is
    // copied from one of the dummy accounts hardhat provide
    }
}
};
