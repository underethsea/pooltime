import React, { useRef, ReactNode } from 'react';
// import { GetChainIcon } from '../utils/getChain';
import PrizeIcon from './prizeIcon';
import { NumberWithCommas } from '../utils/tokenMaths';
import { CropDecimals } from '../utils/tokenMaths';
import {ethers} from "ethers"
import { BarChart, Bar, XAxis, TooltipProps, Cell, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface AggregateWin {

    network: number;
    draw: number;
    totalPayout: string;
    tiers: number[];
    prizes: number;
  }
interface WinsModalProps {
    showModal: boolean;
    onClose: () => void;
    wins: AggregateWin[]; // Assuming AggregateWin is your win type
    children: any;
  }
  
  const CustomTooltip: React.FC<TooltipProps<number, string>>  = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const payout = payload[0].value; // assuming payload for payout is directly the value
      if(payout){
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'white', fontSize:'13px',color: 'black',borderRadius: '10px',padding: '5px', border: '1px solid #ddd' }}>
          <p>{`${label} | ${payout.toFixed(5)} WETH`}</p> {/* label is used here */}
        </div>
      );}
    }
    return null;
  };
  
  const calculateTotalAmountWon = (flatWins: any) => {
    // console.log("calculating total won");
    return flatWins
      .reduce((acc: any, win: any) => {
        return acc + BigInt(win.totalPayout);
      }, BigInt(0))
      .toString();
  };
  const WinsModal: React.FC<WinsModalProps> = ({ showModal, onClose, wins }) => {
   const totalAmountWon = calculateTotalAmountWon(wins)
    const modalRef = useRef<HTMLDivElement>(null);
  
    const closeModal = (e: React.MouseEvent) => {
      if (modalRef.current === e.target) {
        onClose();
      }
    };
    // const payoutToColor = (payout:any, minPayout, maxPayout) => {
    //     const ratio = (payout - minPayout) / (maxPayout - minPayout);
    //     const hue = (1 - ratio) * 120; // 120 is green, 0 is red
    //     return `hsl(${hue}, 100%, 50%)`; // This generates a color between red and green
    //   };
      
    const getColor = (value: any, minPayout: any, maxPayout: any) => {
        // Apply logarithmic scale to the value
        const logValue = Math.log(value);
        const logMin = Math.log(minPayout);
        const logMax = Math.log(maxPayout);
        // Normalize to 0-1 based on log scale
        const intensity = (logValue - logMin) / (logMax - logMin);
        // Calculate color based on intensity
        // Increase the base alpha by 10% and increase the multiplier to allow for a 20% increase at the high end
        const baseAlpha = 0.2 + 0.1; // Increased by 10%
        const maxAlpha = 0.6 + 0.2; // Increase the range by 20%
        // return `rgba(146, 142, 226, ${baseAlpha + intensity * maxAlpha})`;
        return `rgba(216, 222, 326, ${baseAlpha + intensity * maxAlpha})`;

      };
      
      const sortedData = [...wins].sort((a, b) => a.draw - b.draw).map(win => ({
        name: `Draw ${win.draw}`,
        payout: parseFloat(ethers.utils.formatUnits(win.totalPayout, 18)),
        // Additional data you might want to use in the tooltip
      }));
      const payouts = wins.map(win => parseFloat(ethers.utils.formatUnits(win.totalPayout, 18)));
      const minPayout = Math.min(...payouts);
      const maxPayout = Math.max(...payouts);
    
      const totalWins = wins.length;
      let winsText = totalWins === 1 ? "WON " : `${totalWins} WINS `;
    return showModal ? (
        <div style={styles.modalOverlay} onClick={closeModal} ref={modalRef}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} >
<div style={{backgroundColor:"#030526"}}>
<center><span style={{fontSize:'26px'}}>
            {winsText}&nbsp;
            {Number(totalAmountWon) > 0 && (
              <>
                {" "}
                <span
                  style={{
                    display: "inline-block",
                    verticalAlign: "bottom",
                    marginRight: "6px",
                  }}>
                  <PrizeIcon size={18} />
                </span>
                {(parseFloat(totalAmountWon) / 1e18).toFixed(5)}
              </>
            )}</span>
      </center><br></br>

    <ResponsiveContainer width="100%" height={450}>
      <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <defs>
      <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8884d8" stopOpacity={0.9}/>
        <stop offset="100%" stopColor="#8884d8" stopOpacity={0.05}/>
      </linearGradient></defs>
        {/* <CartesianGrid stroke="#d6e0e16b" strokeDasharray="3 3" /> */}
        <XAxis dataKey="name" tick={{ fill: '#dee2e4' }} angle={-45} textAnchor="end" height={100} />
        <YAxis 
          scale="log" 
          domain={['auto', 'auto']} 
          tickFormatter={(value) => value.toFixed(5)} tick={{ fill: '#dee2e4' }}           
          allowDataOverflow={true}
        />
        <Tooltip content={<CustomTooltip />} formatter={(value:any) => value.toFixed(5)} />

        {/* <Legend /> */}
        <Bar dataKey="payout" minPointSize={5}>
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.payout, minPayout, maxPayout)} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  

    </div></div></div>

    ) : null;
          {/* <h2>All Wins</h2>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {wins.map((win, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <div style={styles.winDetail}>
                  <div style={styles.symbol}>
                    {win.network && (
                      <>
                        <img
                          src={GetChainIcon(win.network)}
                          width={16}
                          height={16}
                          alt="Chain Icon"
                          style={{ marginRight: "5px" }}
                        />
                      </>
                    )}
                    Draw {win.draw}
                  </div>
                  <div style={styles.earnings}>
                    <PrizeIcon size={16} />
                    &nbsp;
                    {NumberWithCommas(
                      CropDecimals(ethers.utils.formatUnits(win.totalPayout, 18))
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={onClose} style={{ marginTop: "20px" }}>Close</button> */}
    //     </div>
    //   </div>
   
  };
  
export default WinsModal  

const styles: any = {
    heatmapContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        // other container styles
      },
      heatmapTile: {
        width: '100px', // or whatever tile size you want
        height: '100px',
        margin: '5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // other tile styles
      },
    container: {
      backgroundColor: "#b4ccd1",
      padding: "20px",
      borderRadius: "10px",
      marginTop: "10px",
      width: "350px",
      display: "inline-block",
      "@media (min-width: 768px)": {
        display: "inline-flex",
        minWidth: "auto",
      },
    },
  
    contentContainer: {
      display: "flex",
      alignItems: "center",
    },
  
    vaultGrid: {
      backgroundColor: "#e5f3f5",
      display: "flex",
      flexDirection: "column",
      gap: "1px",
      paddingRight: "5px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      padding: "10px",
      width: "100%", // Ensure the grid takes the full width of its parent
    },
    vaultCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "transparent",
      padding: "6px",
      width: "100%", // This will stretch each card to take the full width of the vaultGrid
      boxSizing: "border-box", // Ensure padding doesn't affect the overall width
    },
  
    // Remove the last entry's bottom border
    lastVaultCard: {
      borderBottom: "none",
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
    arrowIcon: {
      height: "16px",
      cursor: "pointer",
      paddingTop: "14px",
    },
    earnings: {
      // marginRight: "12px",
      textAlign: "right",
      flex: 1,
    },
  
    arrowsContainer: {
      display: "flex",
      paddingLeft: "10px",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100%",
    },
  
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      color: "white",
      maxWidth: "500px",
      width: "85%",
    //   backgroundColor: "#FFFFFF",
    backgroundColor: "#030526",
      padding: "20px 20px 20px 20px",
      margin: "10px 10px 10px 10px",
      borderRadius: "25px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
      position: "relative",
      textAlign: "center",
    //   backgroundImage:
    //     "linear-gradient(120deg, rgb(240, 147, 251) 0%, #575df5 100%)",
      overflow: "hidden", // to hide the confetti that falls out of the modal
    },
    modalHeader: {
      position: "relative", // Added this line
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "10px",
      marginBottom: "20px",
      fontSize: "23px",
      color: "#ceedeb",
    },
    headerText: {
      backgroundColor: "#352347db",
      borderRadius: "7px",
      padding: "10px",
    },
    closeModalButton: {
      background: "none",
      border: "none",
      fontSize: "15px",
      cursor: "pointer",
      color: "#FFF",
      padding: "0px",
      marginLeft: "10px", // give a little space from the text
      marginTop: "-25px",
    },
    modalTier: {
      fontSize: "19px",
    },
    winValue: {
      fontSize: "58px",
    },
  };
  
  