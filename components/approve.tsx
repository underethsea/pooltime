import { ADDRESS, ABI, CONFIG } from "../constants/";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

interface ApproveProps {
  chainProp: string;
  onClose: () => void;
}

const Approve: React.FC<ApproveProps> = ({ chainProp, onClose }) => {
  const closeApprove = () => {
    onClose();
  };

  const {
    data: approveData,
    isPending: approveIsLoading,
    isSuccess: approveIsSuccess,
    writeContract: write,
  } = useWriteContract();
  const { isLoading: approveWaitLoading, isSuccess: approveWaitSuccess } = useWaitForTransactionReceipt({hash:approveData})
 
  // const { address, isConnecting, isDisconnected } = useAccount();
  useEffect(() => {
    if (approveWaitSuccess) {
      const toastId = "approve-success";
      if (!toast.isActive(toastId)) {
        toast("Approve success!", {
          position: toast.POSITION.BOTTOM_LEFT,
          toastId: toastId,
        });
      }
    }
  }, [approveWaitSuccess]);

  const { address, isConnecting, isDisconnected, chainId } = useAccount();

  return (
    <>
      <button
        className="button"
        // disabled={!write || !address}
        onClick={() => {
          console.log("approveper");
          if(chainId===CONFIG.CHAINID){
          write({
              address: ADDRESS[chainProp]?.PRIZETOKEN.ADDRESS as any,
              abi: ABI.POOL,
              functionName: "approve",
            args: [
              ADDRESS[chainProp].LIQUIDATIONROUTER,
              // ethers.constants.MaxUint256
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            ],
          });
        }else{
          toast("Wrong chain!", {
            position: toast.POSITION.BOTTOM_LEFT,
          });
        }}}>
        {approveIsLoading ? "SEE WALLET" : "APPROVE"}
      </button>

      <ToastContainer />
    </>
  );
};

export default Approve;
