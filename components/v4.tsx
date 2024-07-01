


import React ,{ useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {ethers} from "ethers"
import { PROVIDERS } from "../constants/providers";
import Image from "next/image";
import { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface WinProps {
    addressProp: string;
  }
  
// Placeholder ABI definitions and contract addresses
const TICKET_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const PRIZEPOOL_ABI = [
  {
    "name": "withdrawFrom",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Define a type that represents the structure of your contract addresses
type NetworkNames = 'OPTIMISM' | 'POLYGON' | 'MAINNET' | 'AVALANCHE';

// Define the structure of your contract addresses more explicitly
const CONTRACT_ADDRESSES: Record<NetworkNames, { TICKET: string; PRIZEPOOL: string }> = {
  OPTIMISM: {
    TICKET: '0x62BB4fc73094c83B5e952C2180B23fA7054954c4',
    PRIZEPOOL: '0x79Bc8bD53244bC8a9C8c27509a2d573650A83373'
  },
  POLYGON: {
    TICKET: '0x6a304dFdb9f808741244b6bfEe65ca7B3b3A6076',
    PRIZEPOOL: '0x19DE635fb3678D8B8154E37d8C9Cdf182Fe84E60'
  },
  MAINNET: {
    TICKET: '0xdd4d117723C257CEe402285D3aCF218E9A8236E1',
    PRIZEPOOL: '0xd89a09084555a7D0ABe7B111b1f78DFEdDd638Be'
  },
  AVALANCHE: {
    TICKET: '0xB27f379C050f6eD0973A01667458af6eCeBc1d90',
    PRIZEPOOL: '0xF830F5Cb2422d555EC34178E27094a816c8F95EC'
  }
};



const V4: React.FC<WinProps> = ({ addressProp }) => {

  const [balances, setBalances] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [totalBalance, setTotalBalance] = useState(ethers.BigNumber.from(0));



  useEffect(() => {
    if (addressProp) {
      fetchBalances();
    }
  }, [addressProp]);

  // Adjust your fetchBalances function to work with the strongly typed CONTRACT_ADDRESSES
const fetchBalances = async () => {
    const balancePromises = (Object.keys(CONTRACT_ADDRESSES) as NetworkNames[]).map(async (network) => {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES[network].TICKET, TICKET_ABI, PROVIDERS[network]);
      // console.log("v4 checing balance for",addressProp,"on",network)
      // console.log("v4 balance",await contract.balanceOf(addressProp))
      return contract.balanceOf(addressProp).then((balance:any) => {
        return balance.gt(0) ? { network, balance: balance } : null;
      }).catch((error:any) => {
        console.error(`Error fetching balance for ${network}:`, error);
        return null; // Handle the error appropriately
      });
    });
  
    const results = await Promise.all(balancePromises);
    // console.log("v4 results",results)
    const filteredResults = results.filter(result => result !== null);
    const total = results.reduce((acc, result) => {
        // Ensure result is not null and has a balance property
        if (result && result.balance) {
          // Add the BigNumber balance to the accumulator
          return acc.add(result.balance);
        } else {
          return acc;
        }
      }, ethers.BigNumber.from(0));
      
          setTotalBalance(total);
    setBalances(filteredResults as any);
  };

  function isNetworkName(value: string): value is NetworkNames {
    return value in CONTRACT_ADDRESSES;
}
  const contractAddress = isNetworkName(selectedNetwork) ? CONTRACT_ADDRESSES[selectedNetwork].PRIZEPOOL as `0x${string}` : undefined;

  // const { config } = usePrepareContractWrite({
  //   address: contractAddress,
  //   abi: PRIZEPOOL_ABI,
  //   functionName: "withdrawFrom",
  //   // Add any required parameters for the withdraw function if necessary
  //   args: [/* Your arguments here */],
  //   enabled: Boolean(selectedNetwork),
  // });

  // const { write } = useWriteContract({
  //   ...config,
  //   onSuccess(data) {
  //     toast.success(`Withdrawal successful! Transaction hash: ${data.hash}`);
  //     // Refresh balances after withdrawal
  //     fetchBalances();
  //   },
  //   onError(error) {
  //     toast.error(`Withdrawal failed: ${error.message}`);
  //   },
  // });

  const handleWithdraw = (network:string) => {
    setSelectedNetwork(network);
  };

  // useEffect(() => {
  //   if (write && selectedNetwork) {
  //     write();
  //   }
  // }, [write, selectedNetwork]);

  return (
    <div>
      {/* {balances.map(({ network, balance }) => (
        <button key={network} onClick={() => handleWithdraw(network)}>
          Withdraw from {network}: {(Number(balance)/1e6).toFixed(2)} tokens
        </button>
      ))} */}

      {Number(totalBalance)/1e6 > .01 && 
              <div style={styles.contentContainer}>
            <div style={styles.vaultGrid}>
            <div style={styles.vaultCard}>

           V4 Tickets
      <div style={styles.alignBottom}>

      <Image src="https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694" height={20} width={20} alt="USDC" />&nbsp;{(Number(totalBalance)/1e6).toFixed(2)}
      &nbsp; <a href="https://migrate.cabana.fi" target="_blank" rel="noopener noreferrer">
  <FontAwesomeIcon icon={faExternalLink}
                   size="sm"
                   style={{
                     color: "#1a4160",
                     height: "15px",
                     paddingLeft: "15px",
                   }}
  />
</a>
      </div></div></div></div>}
      <ToastContainer />
    </div>
  );
};


const styles : { [key: string]: CSSProperties }  = {
    container: {
      marginTop: "10px",
      backgroundColor: "#b4ccd1",
      padding: "20px",
      borderRadius: "10px",
      width: "350px",
      display: 'inline-block',
      ...({ '@media (min-width: 768px)': { display: 'inline-flex', minWidth: 'auto' } } as Partial<CSSProperties>),
    },
    arrowIcon: {
      height: "16px",
      marginTop:"5px",
      marginBottom:"5px",
    },
    vaultGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "10px",
      maxWidth: "300px",
      margin: "0 auto",
    },
    vaultCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      width: "100%",
      minWidth: "280px"
    },
    newVaultCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      border: "2px solid #b534ff",
      animation: "highlight 10s ease-in-out",
      width: "100%",
      minWidth: "280px"
    },
    symbol: {
      marginRight: "12px",
      display: "flex",
      alignItems: "center",
    },
    alignBottom: {
      display: "flex",
      alignItems: "center",
    },
    contentContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    whyPlay: {
        backgroundColor: "#e5f3f5",
        padding: "20px 9px 20px 9px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        width: "100%",
        minWidth: "280px",
        fontSize: "19px",
        marginBottom: "5px",
        marginTop:"11px",
      }
  };
  
export default V4;
