import * as wagmi from 'wagmi';
import { useProvider, useSigner } from 'wagmi';
import AmmContract from '../../../Hardhat/artifacts/contracts/AMM.sol/AMM.json';
import { makeBig, makeNum } from '../../lib/number-utils';

import useMaticContract from './useMaticContract';
import useGoflowContract from './useGoflowContract';

interface PoolDetails {
  totalMatic: string;
  totalGoflow: string;
  totalShares: string;
}

interface UserHoldings {
  userMatic: string;
  userGoflow: string;
  userShares: string;
}

const useAmmContract = () => {
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const maticContract = useMaticContract();
  const goflowContract = useGoflowContract();

  const contract = wagmi.useContract({
    // Change this adress after every deploy!
    addressOrName: '0x3a06be1DC243D1c3332FC1B9a380a7Cb2c71C30a',
    contractInterface: AmmContract.abi,
    signerOrProvider: signer || provider,
  });

  const getPoolDetails = async (): Promise<PoolDetails> => {
    const poolDetails = await contract.getPoolDetails();

    // Convert from BigNumber to human readable strings for front-end
    return {
      totalMatic: makeNum((poolDetails.maticAmount).toString()),
      totalGoflow: makeNum((poolDetails.goflowAmount).toString()),
      totalShares: makeNum((poolDetails.ammShares).toString()),
    };
  };

  const getUserHoldings = async (address: string): Promise<UserHoldings> => {
    const userHoldings = await contract.getMyHoldings(address);

    // Convert from BigNumber to human readable strings for front-end
    return {
      userMatic: makeNum((userHoldings.maticAmount).toString()),
      userGoflow: makeNum((userHoldings.goflowAmount).toString()),
      userShares: makeNum((userHoldings.myShare).toString()),
    };
  };

  const getSwapMaticEstimate = async (amountMatic: string): Promise<string> => {
    // find out the amount of GOFLOW we get for a given amount of MATIC
    const goflowEstimateBN = await contract.getSwapMaticEstimate(makeBig(amountMatic));
    return makeNum(goflowEstimateBN.toString());
  };

  const getSwapGoflowEstimate = async (amountGoflow: string): Promise<string> => {
    // find out the amount of MATIC we get for a given amount of GOFLOW
    const maticEstimateBN = await contract.getSwapGoflowEstimate(makeBig(amountGoflow));
    return makeNum(maticEstimateBN.toString());
  };

  const swapMaticForGoflow = async (amountMatic: string): Promise<void> => {
    const amountMaticBN = makeBig(amountMatic);

    await maticContract.approve(contract.address, amountMaticBN);

    const swapTx = await contract.swapMatic(amountMaticBN);
    await swapTx.wait();
  };

  const swapGoflowForMatic = async (amountGoflow: string): Promise<void> => {
    const amountGoflowBN = makeBig(amountGoflow);

    await goflowContract.approve(contract.address, amountGoflowBN);

    const swapTx = await contract.swapGoflow(amountGoflowBN);
    await swapTx.wait();
  };

  return {
    contract,
    chainId: contract.provider.network?.chainId,
    getPoolDetails,
    getUserHoldings,
    getSwapMaticEstimate,
    getSwapGoflowEstimate,
    swapMaticForGoflow,
    swapGoflowForMatic,
  };
};

export default useAmmContract;