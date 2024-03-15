const { expect } = require("chai");
const { ethers } = require("hardhat");
const ether = require("ethers");
const maticAbi = require("../artifacts/contracts/Matic.sol/Matic.json");
const goflowAbi = require("../artifacts/contracts/OurToken.sol/Goflow.json");
const ammAbi = require("../artifacts/contracts/Amm.sol/AMM.json");
// Add this utility function to the top of your test file...

function logBalances(myHoldings) {
  for (const [key, value] of Object.entries(myHoldings)) {
    if (key.length > 1) {
      console.log("  ", `${key}: ${ether.ethers.parseUnits(value, 18)}`);
    }
  }
}
describe("Amm", () => {
  let amm;
  let matic;
  let goflow;
  let owner, user1;
  let ammAddress;
  let goflowAddress;
  let maticAddress;
  // Quickly approves the AMM contract and provides it with liquidity for a given user
  const provideLiquidity = async (
    user,
    allowAmount = "1000",
    provideAmount = "100"
  ) => {
    const allow = ether.ethers.parseUnits(allowAmount, 18); //1_000
    const provide = ether.ethers.parseUnits(provideAmount, 18); //100
    await goflow.connect(user).approve(ammAddress, allow);
    await matic.connect(user).approve(ammAddress, allow);
    await amm.connect(user).provide(provide, provide);
  };

  beforeEach(async () => {
    // the getSigners() method allows us a to create mock users
    const [_owner, _user1] = await ethers.getSigners();
    owner = _owner;
    user1 = _user1;
  });

  beforeEach(async () => {
    // Deploy the Matic contract
    const Matic = await ethers.deployContract("Matic");
    await Matic.waitForDeployment();
    maticAddress = await Matic.getAddress();
    matic = new ethers.Contract(maticAddress, maticAbi.abi, owner);
    // Deploy the Goflow contract
    const Goflow = await ethers.deployContract("Goflow");
    await Goflow.waitForDeployment();
    goflowAddress = await Goflow.getAddress();
    goflow = new ethers.Contract(goflowAddress, goflowAbi.abi, owner);
    // Deploy the AMM contract
    const Amm = await ethers.deployContract("AMM", [
      maticAddress,
      goflowAddress,
    ]);
    await Amm.waitForDeployment();
    ammAddress = await Amm.getAddress();
    amm = new ethers.Contract(ammAddress, ammAbi.abi, owner);
    // Mint and transfer tokens so that owner and user1 have 1000 of each
    await goflow.mint(ether.ethers.parseUnits("1000", 18));
    await goflow.connect(user1).mint(ether.ethers.parseUnits("1000", 18));
    await matic.transfer(user1.address, ether.ethers.parseUnits("1000", 18));
  });

  describe("Deployment", () => {
    it("should deploy the contracts", async () => {
      expect(await matic.totalSupply()).to.equal(
        ether.ethers.parseUnits("2000", 18)
      );
      expect(await goflow.totalSupply()).to.equal(
        ether.ethers.parseUnits("2000", 18)
      );
      expect(await ammAddress).to.exist;
    });
  });

  describe("Provide liquidity", () => {
    it("should allow a user to provide liquidity", async () => {
      await provideLiquidity(owner);
      const [totalmatic, totalGoverflow, totalShares] =
        await amm.getPoolDetails();
      expect(totalmatic).to.equal(ether.ethers.parseUnits("100", 18));
      expect(totalGoverflow).to.equal(ether.ethers.parseUnits("100", 18));
      expect(totalShares).to.equal(ether.ethers.parseUnits("100", 18));
    });
  });

  describe("Swaps", () => {
    it("should be possible to swap matic for goflow", async () => {
      await provideLiquidity(owner);
      await matic.approve(ammAddress, ether.ethers.parseUnits("100", 18)); // approve before we can move with transferFrom

      const tx = await amm.swapMatic(ether.ethers.parseUnits("100", 18));
      await tx.wait();

      expect(tx.hash).to.exist;
      expect(await matic.balanceOf(ammAddress)).to.equal(
        ether.ethers.parseUnits("200", 18)
      );
      expect(await goflow.balanceOf(ammAddress)).to.equal(
        ether.ethers.parseUnits("50", 18)
      );
    });

    it("should be possible to swap goflow for matic", async () => {
      await provideLiquidity(owner);
      await goflow.approve(ammAddress, ether.ethers.parseUnits("100", 18)); // approve before we can move with transferFrom

      const tx = await amm.swapGoflow(ether.ethers.parseUnits("100", 18));
      await tx.wait();

      expect(tx.hash).to.exist;
      expect(await matic.balanceOf(ammAddress)).to.equal(
        ether.ethers.parseUnits("50", 18)
      );
      expect(await goflow.balanceOf(ammAddress)).to.equal(
        ether.ethers.parseUnits("200", 18)
      );
    });
  });
  describe('Withdraw', () => {
    it('should be possible to withdraw shares', async () => {
      let myHoldings = await amm.getMyHoldings(owner.address);
      console.log('INITIAL:');
      logBalances(myHoldings);
  
      await provideLiquidity(owner); // provides 100 of each token by default
      
      myHoldings = await amm.getMyHoldings(owner.address);
      console.log('BEFORE WITHDRAWAL: ');
      logBalances(myHoldings);
  
      expect(myHoldings.myShare).to.equal(ether.ethers.parseUnits('100',18));
  
      // withdraw logic & tests will go here...
    });
    it('should be possible for two users to withdraw shares', async () => {
        await provideLiquidity(owner);
        await provideLiquidity(user1);
      
        const ownersShare = await amm.connect(owner).getMyHoldings(owner.address);
        const user1Share = await amm.connect(user1).getMyHoldings(user1.address);
        let poolDetails = await amm.getPoolDetails();
        console.log('owner share:', ownersShare.myShare);
        console.log('user1 share:', user1Share.myShare);
        console.log('poolDetails:');
        logBalances(poolDetails);
      
        expect(poolDetails.ammShares).to.equal(ether.ethers.parseUnits('200',18));
      
        await amm.withdraw(ownersShare.myShare);
        await amm.connect(user1).withdraw(user1Share.myShare);
        poolDetails = await amm.getPoolDetails();
        
        expect(poolDetails.ammShares).to.equal(0);
      });
  });
});
// ... add this describe block at the bottom of your test file


