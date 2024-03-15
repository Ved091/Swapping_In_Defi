// import { ethers } from 'hardhat';
// import { makeBig } from '../../Front-end/lib/number-utils';
const {ethers} = require('hardhat');
const ether = require('ethers');
const {makeBig} = require("../../Front-end/lib/number-utils")
const maticAbi = require("../artifacts/contracts/Matic.sol/Matic.json");
const ammAbi = require("../artifacts/contracts/Amm.sol/AMM.json");
const goflowAbi = require('../artifacts/contracts/OurToken.sol/Goflow.json')
const forumAbi = require("../artifacts/contracts/Forum.sol/Forum.json")
async function main() {
  // let's get a another SignerWithAddress to upvote a question
  const [owner] = await ethers.getSigners();
  // deploy the contracts
  // const Goflow = await ethers.getContractFactory('Goflow');
  // const goflow = await Goflow.deploy();
  const Goflow = await ethers.deployContract('Goflow');
  await Goflow.waitForDeployment();
  // console.log('...these addresses may change');
  const GoflowAddress = await Goflow.getAddress();
  console.log('goflow deployed to: ',GoflowAddress);
  // const Forum = await ethers.getContractFactory('Forum');
  // pass the GOFLOW token address to the Forum contract's constructor!
  const Forum = await ethers.deployContract('Forum',[GoflowAddress]);
  await Forum.waitForDeployment();
  const ForumAddress = await Forum.getAddress();
  console.log('forum deployed to: ',ForumAddress);

  // Let's populate our app with some questions and answers.
  // We are posting as `owner` by default
  const goflow = new ethers.Contract(GoflowAddress,goflowAbi.abi,owner);
  const forum = new ethers.Contract(ForumAddress,forumAbi.abi,owner);
  const qTx = await forum.postQuestion('Are you my fren? 🤗');
  await qTx.wait();

  // Let's post an answer to the question
  // Our first question has the id 0 which we pass as the first argument
  // const answerTx = await forum.postAnswer(0, '1st answer');
  // await answerTx.wait();

  // const answerTx2 = await forum.postAnswer(0, '2nd answer');
  // await answerTx2.wait();

  // What a nice answer 🤝 🤗
  const answerTx3 = await forum.postAnswer(0, 'Yes, I am ur fren! 👊');
  await answerTx3.wait();

  // Connect to `user1` in order to mint, approve, and upvote an answer
  // We need to parse the token amount into a BigNumber of the correct unit
  // console.log(parseInt(Number(makeBig('100.0')._hex)));

  // const mintTx = await goflow.connect(user1).mint(ether.ethers.parseUnits('1000',18)); 
  // await mintTx.wait();
  // // "approve before someone else can move" our tokens with the transferFrom method
  // const approve = await goflow.connect(user1).approve(ForumAddress, ether.ethers.parseUnits('1000',18));
  // await approve.wait();

  // // // upvote answer with id 2, 'Yes, I am ur fren! 👊'
  // const upvote1 = await forum.connect(user1).upvoteAnswer(2);
  // await upvote1.wait();
  
  const Matic = await ethers.deployContract('Matic');
  await Matic.waitForDeployment();
  const MaticAddress = await Matic.getAddress();
  const matic = new ethers.Contract(MaticAddress,maticAbi.abi,owner);
  console.log('matic deployed to: ',MaticAddress);

  const AMM = await ethers.deployContract('AMM',[MaticAddress, GoflowAddress]);
  await AMM.waitForDeployment()
  const AmmAddress = await AMM.getAddress();
  console.log("amm deployed to",AmmAddress);
  const amm = new ethers.Contract(AmmAddress,ammAbi.abi,owner);

  // mint more for AMM liquidity
  const mint = await goflow.mint(ether.ethers.parseUnits('1000',18));
  await mint.wait();

  const approve = await goflow.approve(AmmAddress, ether.ethers.parseUnits('1000',18));
  await approve.wait();
  const approve2 = await matic.approve(AmmAddress, ether.ethers.parseUnits('1000',18));
  await approve2.wait();

  const liquidity = await amm.provide(ether.ethers.parseUnits('100',18), ether.ethers.parseUnits('100',18));
  await liquidity.wait();

  // await goflow.mint(ether.ethers.parseUnits('1000',18));
  // await goflow.connect(user1).mint(ether.ethers.parseUnits('1000',18));
  // // Owner mints 2000 matic ond deploy, transfers 1000 from owner to user1
  // await matic.transfer(user1.address, ether.ethers.parseUnits('1000',18));

  // const provideLiquidity = async (user, allowAmount = '1000', provideAmount = '100') => {
  //   const allow = ether.ethers.parseUnits(allowAmount,18); //1000
  //   const provide = ether.ethers.parseUnits(provideAmount,18); //100

  //   const approve = await goflow.connect(user).approve(AmmAddress, allow);
  //   await approve.wait();
  //   const approve2 = await matic.connect(user).approve(AmmAddress, allow);
  //   await approve2.wait();

  //   const liquidity = await amm.connect(user).provide(provide, provide);
  //   await liquidity.wait();
  // };

  // await provideLiquidity(owner); // owner approves AMM to transfer 1000 of each token & provides 100 of each token to the AMM contract
  // await provideLiquidity(user1); // user1
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });