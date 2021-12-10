import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, contract } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 10px;
  border: none;
  background-color: var(--button);
  padding: 10px;
  font-weight: bold;
  color: var(--secondary-text);
  width: 100px;
  cursor: pointer;
  margin-right: 20px;
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: stretched;
  align-items: stretched;
  width: 100%;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`;

export const StyledLogo = styled.img`
  width: 200px;
  @media (min-width: 767px) {
    width: 300px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
`;

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  border: 4px dashed var(--secondary);
  background-color: var(--accent);
  border-radius: 100%;
  width: 200px;
  @media (min-width: 900px) {
    width: 250px;
  }
  @media (min-width: 1000px) {
    width: 300px;
  }
  transition: width 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft1, setClaimingNft1] = useState(false);
  const [claimingNft2, setClaimingNft2] = useState(false);
  const [feedback, setFeedback] = useState(`Click on tier to mint your NFT.`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = async (tier) => {

    let cost = 0;
    let gasLimit = 0;

    if (tier === 1) {
      if (await blockchain.smartContract.methods.walletIsInWhiteListTier1(blockchain.account).call()) {
        cost = await blockchain.smartContract.methods.getWhitelistPrice().call()
      } else {
        cost = await blockchain.smartContract.methods.getTier1Price().call()
      }
    } else if (tier === 2) {
      if (await blockchain.smartContract.methods.walletIsInWhiteListTier2(blockchain.account).call()) {
        cost = await blockchain.smartContract.methods.getWhitelistPrice().call()
      } else {
        cost = await blockchain.smartContract.methods.getTier2Price().call()
      }
    }

    let totalCostWei = String(cost);
    let userBalance = await blockchain.web3.eth.getBalance(blockchain.account)

    if (blockchain.web3.utils.fromWei(totalCostWei) > blockchain.web3.utils.fromWei(userBalance)) {
      setFeedback("Insufficient funds")
      return
    }

    console.log("Cost: ", totalCostWei);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);

    if (tier === 1) {
      setClaimingNft1(true);
      setClaimingNft2(false);
      await blockchain.smartContract.methods
      .mintTier1()
      .estimateGas({
        from: blockchain.account,
        value: totalCostWei,
      })
      .then((estimatedGas) => {
        gasLimit = estimatedGas
      })
      .catch((error) => {
        catchError(error)
        setClaimingNft1(false)
      })

      if (gasLimit > 0) {
        blockchain.smartContract.methods
        .mintTier1()
        .send({
          gasLimit: String(gasLimit),
          to: CONFIG.CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`
          );
          setClaimingNft1(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch((error) => {
          console.log(error);
          catchError(error)
          setClaimingNft1(false)
        })
      }
    } else if (tier === 2) {
      setClaimingNft1(false);
      setClaimingNft2(true);
      await blockchain.smartContract.methods
      .mintTier2()
      .estimateGas({
        from: blockchain.account,
        value: totalCostWei,
      })
      .then((estimatedGas) => {
        gasLimit = estimatedGas
      })
      .catch((error) => {
        catchError(error)
        setClaimingNft2(false)
      })

      if (gasLimit > 0) {
        await blockchain.smartContract.methods
        .mintTier2()
        .send({
          gasLimit: String(gasLimit),
          to: CONFIG.CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`
          );
          setClaimingNft2(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch((error) => {
          console.log(error);
          catchError(error)
          setClaimingNft2(false)
        })
      }
    }
  };

  const catchError = (error) => {
    if (error.message.includes('Internal JSON-RPC error.')) {
      const split = error.message.split('Internal JSON-RPC error.')
      if (typeof split[1] !== 'undefined') {
        error = JSON.parse(error.message.split('Internal JSON-RPC error.')[1])
        setFeedback(error.message)
      }
    } else if (error.message) {
      setFeedback(error.message)
    } else {
      setFeedback('Something went wrong.')
    }
  }

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 10) {
      newMintAmount = 10;
    }
    setMintAmount(newMintAmount);
  };

  const getData = () => {
    if (blockchain.account !== null && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const connectContract = async () => {
    await dispatch(contract());
    dispatch(fetchData());
  }

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    connectContract()
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <s.Screen>
      <s.Container style={{
              textAlign: 'center',
              display: 'inline',
              paddingBottom: '100px',
              backgroundColor: '#000',
              paddingTop: '25px'
            }}>
      <StyledLogo alt={"logo"} src={"/config/images/logo_2.png"} style={{
              height: '70px',
              width: '70px',
              display: 'block',
              float: 'left'
            }} />
      <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
      </s.Container>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <s.SpacerSmall />
        <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.Container flex={1} jc={"center"} ai={"center"}>
            {/* <StyledImg alt={"example"} src={"/config/images/example.gif"} /> */}
          </s.Container>
          <s.SpacerLarge />
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: 24,
              borderRadius: 24,
              border: "4px dashed var(--secondary)",
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
              position: 'relative',
              top: '-120px',
              height: '400px'
            }}
          >
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 50,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              {data.totalSupply} / {CONFIG.MAX_SUPPLY}
            </s.TextTitle>
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              <StyledLink target={"_blank"} href={CONFIG.SCAN_LINK}>
                {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
              </StyledLink>
            </s.TextDescription>
            <s.SpacerSmall />
            {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  The sale has ended.
                </s.TextTitle>
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  You can still find {CONFIG.NFT_NAME} on
                </s.TextDescription>
                <s.SpacerSmall />
                <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                  {CONFIG.MARKETPLACE}
                </StyledLink>
              </>
            ) : (
              <>
                <s.SpacerSmall />
                {blockchain.account === null ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--label-text)",
                      }}
                    >
                      Connect to the {CONFIG.NETWORK.NAME} network
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(connect());
                        getData();
                      }}
                    >
                      CONNECT
                    </StyledButton>
                    {blockchain.errorMsg !== "" ? (
                      <>
                        <s.SpacerSmall />
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          {blockchain.errorMsg}
                        </s.TextDescription>
                      </>
                    ) : null}
                  </s.Container>
                ) : (
                  <>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {feedback}
                    </s.TextDescription>
                    <s.SpacerMedium />
                    {/* <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledRoundButton
                        style={{ lineHeight: 0.4 }}
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          decrementMintAmount();
                        }}
                      >
                        -
                      </StyledRoundButton>
                      <s.SpacerMedium />
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          color: "var(--accent-text)",
                        }}
                      >
                        {mintAmount}
                      </s.TextDescription>
                      <s.SpacerMedium />
                      <StyledRoundButton
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          incrementMintAmount();
                        }}
                      >
                        +
                      </StyledRoundButton>
                    </s.Container> */}
                    <s.SpacerSmall />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                    <s.TextDescription style={{
                        textAlign: "left",
                        width: "20%",
                      }}>
                    {blockchain.tier1 ? (blockchain.whitelistPrice > 0 ? blockchain.whitelistPrice + ' ' + CONFIG.NETWORK.SYMBOL : 'FREE') : blockchain.tier1Price + ' ' + CONFIG.NETWORK.SYMBOL}
                    </s.TextDescription>
                    <s.TextDescription style={{
                        textAlign: "left",
                        width: "20%",
                      }}>
                    {blockchain.tier2 ? (blockchain.whitelistPrice > 0 ? blockchain.whitelistPrice + ' ' + CONFIG.NETWORK.SYMBOL : 'FREE') : blockchain.tier2Price + ' ' + CONFIG.NETWORK.SYMBOL}
                    </s.TextDescription>
                    </s.Container>
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledButton
                        disabled={claimingNft1 || claimingNft2 ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          claimNFTs(1);
                          getData();
                        }}
                      >
                        {claimingNft1 ? "Minting..." : "Tier 1"}
                      </StyledButton>
                      <StyledButton
                        disabled={claimingNft1 || claimingNft2 ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          claimNFTs(2);
                          getData();
                        }}
                      >
                        {claimingNft2 ? "Minting..." : "Tier 2"}
                      </StyledButton>
                    </s.Container>
                  </>
                )}
              </>
            )}
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
          <s.Container flex={1} jc={"center"} ai={"center"}>
            {/* <StyledImg
              alt={"example"}
              src={"/config/images/example.gif"}
              style={{ transform: "scaleX(-1)" }}
            /> */}
          </s.Container>
        </ResponsiveWrapper>
        <s.SpacerMedium />
        {/* <s.Container jc={"center"} ai={"center"} style={{ width: "70%" }}>
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            Please make sure you are connected to the right network (
            {CONFIG.NETWORK.NAME} Mainnet) and the correct address. Please note:
            Once you make the purchase, you cannot undo this action.
          </s.TextDescription>
          <s.SpacerSmall />
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            We have set the gas limit to {CONFIG.GAS_LIMIT} for the contract to
            successfully mint your NFT. We recommend that you don't lower the
            gas limit.
          </s.TextDescription>
        </s.Container> */}
      </s.Container>
    </s.Screen>
  );
}

export default App;
