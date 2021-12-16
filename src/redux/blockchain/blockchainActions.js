// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
// log
import { fetchData } from "../data/dataActions";
import MainConfig from '../../assets/config.json';
import ABIJSON from '../../assets/abi.json';
const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const contractSuccess = (payload) => {
  return {
    type: "CONTRACT_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const contract = () => {
  return async (dispatch) => {
    // const abiResponse = await fetch("/config/abi.json", {
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //   },
    // });
    const abi = ABIJSON;
    // const configResponse = await fetch("/config/config.json", {
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //   },
    // });
    // const CONFIG = await configResponse.json();
    const { ethereum } = window;

    Web3EthContract.setProvider(ethereum);
    let web3 = new Web3(ethereum);
    const SmartContractObj = new Web3EthContract(
      abi,
      MainConfig.CONTRACT_ADDRESS
    );

    dispatch(
      contractSuccess({
        smartContract: SmartContractObj,
        web3: web3,
      })
    );
  }
}

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    
    const abi = ABIJSON;
    // const configResponse = await fetch("/config/config.json", {
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //   },
    // });
    // const CONFIG = await configResponse.json();
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == MainConfig.NETWORK.ID) {
          const SmartContractObj = new Web3EthContract(
            abi,
            MainConfig.CONTRACT_ADDRESS
          );
          let tier1, tier2 = false
          let tier1Price, tier2Price, whitelistPrice  = 0

          if (await SmartContractObj.methods.walletIsInWhiteListTier1(accounts[0]).call()) {
            tier1 = true
          } 

          if (await SmartContractObj.methods.walletIsInWhiteListTier2(accounts[0]).call()) {
            tier2 = true
          }

          tier1Price = web3.utils.fromWei(await SmartContractObj.methods.getTier1Price().call())
          tier2Price = web3.utils.fromWei(await SmartContractObj.methods.getTier2Price().call())
          whitelistPrice = web3.utils.fromWei(await SmartContractObj.methods.getWhitelistPrice().call())
          
          dispatch(
            connectSuccess({
              account: accounts[0],
              tier1: tier1,
              tier2: tier2,
              tier1Price: tier1Price,
              tier2Price: tier2Price,
              whitelistPrice: whitelistPrice,
              smartContract: SmartContractObj,
              web3: web3,
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
        }
      } catch (err) {
        console.log(err)
        dispatch(connectFailed("Something went wrong."));
      }
    } else {
      dispatch(connectFailed("Install Metamask."));
    }
  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
