import { ADDRESS, ABI } from "../constants/";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CONFIG } from "../constants/";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaucet } from "@fortawesome/free-solid-svg-icons";
import { useAccount } from "wagmi";
import React, { useEffect } from "react";

const getRandomVaultAddress = () => {
  let vaults;

  // lock to sepolia for now
  // const chainString: string = chain.name.toUpperCase();
  const chainString = CONFIG.CHAINNAME;

  // console.log(chain.name, "name");
  vaults = ADDRESS[chainString].VAULTS;
  const randomIndex = Math.floor(Math.random() * vaults.length);
  const randomVault = vaults[randomIndex];
  console.log("random vault", randomVault);
  return randomVault.ASSET;
};
interface DripProps {
  chainProp: string;
  addressProp: string;
  updateNow: () => void;
}

const Drip: React.FC<DripProps> = ({ chainProp, addressProp, updateNow }) => {
  const { chain } = useAccount();
  addressProp =
    addressProp === "random" ? getRandomVaultAddress() : addressProp;
  const {
    data: dripData,
    // isLoading: dripIsLoading,
    isSuccess: dripIsSuccess,
    writeContract: write,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast("Dripping!", {
          position: toast.POSITION.BOTTOM_LEFT,
        });
        updateNow();
      },
    },
  });

  const { isLoading: dripWaitLoading, isSuccess: dripWaitSuccess } =
    useWaitForTransactionReceipt({ hash: dripData });

  // const { address, isConnecting, isDisconnected } = useAccount();
  useEffect(() => {
    if (dripWaitSuccess) {
      const toastId = "drip-success";
      if (!toast.isActive(toastId)) {
        toast("Drip success!", {
          position: toast.POSITION.BOTTOM_LEFT,
          toastId: toastId,
        });
        updateNow();
      }
    }
  }, [dripWaitSuccess]);

  return (
    <>
      <FontAwesomeIcon
        icon={faFaucet}
        style={{ color: "#fcfcfd" }}
        size="sm"
        className="token faucet"
        // disabled={!write || !address}
        onClick={() => {
          if (chain && chain.id === CONFIG.CHAINID) {
            console.log(
              "dripper",
              ADDRESS[chainProp],
              chainProp,
              `${ADDRESS[chainProp]?.TOKENFAUCET} ${addressProp}`
            );
            write({
              address: ADDRESS[chainProp].TOKENFAUCET
                ? `0x${ADDRESS[chainProp].TOKENFAUCET.substring(2)}`
                : "0x",
              abi: ABI.TOKENFAUCET,
              functionName: "drip",
              args: [addressProp],
            });
          } else {
            toast("Wrong chain", {
              position: toast.POSITION.BOTTOM_LEFT,
            });
          }
        }}
      />

      <ToastContainer />
    </>
  );
};

export default Drip;
