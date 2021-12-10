const initialState = {
  loading: false,
  account: null,
  tier1: null,
  tier2: null,
  tier1Price: null,
  tier2Price: null,
  whitelistPrice: null,
  smartContract: null,
  web3: null,
  errorMsg: "",
};

const blockchainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CONNECTION_REQUEST":
      return {
        ...initialState,
        loading: true,
      };
    case "CONTRACT_SUCCESS":
        return {
          ...state,
          loading: false,
          smartContract: action.payload.smartContract,
          web3: action.payload.web3,
        };
    case "CONNECTION_SUCCESS":
      return {
        ...state,
        loading: false,
        account: action.payload.account,
        tier1: action.payload.tier1,
        tier2: action.payload.tier2,
        tier1Price: action.payload.tier1Price,
        tier2Price: action.payload.tier2Price,
        whitelistPrice: action.payload.whitelistPrice,
        smartContract: action.payload.smartContract,
        web3: action.payload.web3,
      };
    case "CONNECTION_FAILED":
      return {
        ...initialState,
        loading: false,
        errorMsg: action.payload,
      };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        account: action.payload.account,
      };
    default:
      return state;
  }
};

export default blockchainReducer;
