  import React, { useEffect, useState, CSSProperties } from "react";
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faAward, faArrowUp, faArrowDown, faCheck } from "@fortawesome/free-solid-svg-icons";
  import { GetChainName } from "../utils/getChain";
  // import { TierColors } from "../constants/constants";
import PrizeIcon from "./prizeIcon"; 
 import Link from 'next/link';
  import { NumberWithCommas,CropDecimals } from "../utils/tokenMaths";
  import { ADDRESS, CONFIG } from "../constants/";
  import { useAccount } from "wagmi";
  // import WhyPlay from "./whyPlay"; // Adjust the path based on where you put WhyPlay.tsx

  const chainProp = CONFIG.CHAINID;
  const prizePool = ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL

  interface WinData {
    p: string;
    d: number;
    v: number;
  }

  const TopWinners = () => {
    const [wins, setWins] = useState<WinData[]>([]);
    const [winStartIndex, setWinStartIndex] = useState<number>(0);
    const [maxCards, setMaxCards] = useState<number>(3); // Maximum number of cards to display
    const [currentWinIndex, setCurrentWinIndex] = useState(0);
    const [animState, setAnimState] = useState('enter');
  const [currentWin, setCurrentWin] = useState<WinData | null>(null);


    const { address } = useAccount();


    // const handlePrevious = () => {
    //   if (winStartIndex > 0) {
    //     setWinStartIndex(winStartIndex - 1);
    //   }
    // };

    // const handleNext = () => {
    //   if (winStartIndex < wins.length - maxCards) {
    //     setWinStartIndex(winStartIndex + 1);
    //   }
    // };

    useEffect(() => {
      const fetchWins = async () => {
        const response = await fetch(`https://poolexplorer.xyz/${chainProp}-${prizePool}-bigwins`);
        const data = await response.json();
        setWins(data.slice(0,8));
      };
    
      fetchWins();
    
 
      // Clear interval hen component unmounts
    }, [wins.length]); // wins.length dependency ensures that we don't start the interval until wins are loaded
    

    useEffect(() => {
      const handleResize = () => {
        // Adjust the maximum number of cards based on the screen width
        if (window.innerWidth >= 768) {
          setMaxCards(4);
        } else {
          setMaxCards(3);
        }
      };

      

      // Call the handleResize function initially and on window resize
      handleResize();
      window.addEventListener("resize", handleResize);

      // Clean up the event listener on component unmount
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    useEffect(() => {
      if (!wins || wins.length === 0) return;
    
      const interval = setInterval(() => {
        setAnimState('exit');
        setTimeout(() => {
          setCurrentWinIndex(prevIndex => (prevIndex + 1) % wins.length);
          setAnimState('enter');
        }, 500);  // This duration should match the transition time in your CSS styles
      }, 2000);   // Change the card every 3 seconds
    
      return () => {
        clearInterval(interval);
      };
    }, [wins]);
    


    return (
      <>
        {wins.length > 0 ? (<>
            <div className="box-header" style={{marginTop:"10px",width:"120px"}}>BIG WINS</div>
            <div style={styles.vaultGrid}>
              {/* {wins.map((win, index) => (
                <Link 
                  key={index} 
                  href={`/winners?draw=${win.d}&chain=${chainProp}`} 
                  passHref
                >
                  <div style={styles.vaultCard} className="hover-bgchange">
                    <div style={styles.vaultInfo}>
                      Draw {win.d}
                    </div>
                    <div style={styles.valueContainer}>
                            <PrizeIcon size={17}>

                      <div style={styles.value}>
                        {NumberWithCommas(CropDecimals(win.v / Math.pow(10, ADDRESS[GetChainName(chainProp)].PRIZETOKEN.DECIMALS)))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))} */}
              <Link 
    href={`/winners?draw=${wins[currentWinIndex].d}&chain=${chainProp}`} 
    passHref
  >




    <div style={styles.vaultCard} className="hover-bgchange">
      {/* <div style={styles.vaultInfo}>
        Draw {wins[currentWinIndex].d}
      </div> */}
      <div style={styles.vaultInfo}>
        {wins[currentWinIndex].p.substring(0,8)}
      </div>
      <div style={styles.valueContainer}>
           <PrizeIcon size={17}/>

      
        <div style={styles.value}>
          {NumberWithCommas(CropDecimals(wins[currentWinIndex].v / Math.pow(10, ADDRESS[GetChainName(chainProp)].PRIZETOKEN.DECIMALS)))}
        </div>
      </div>
    </div>
  </Link>

            </div>
          </>
        ) : !address && 
        
  <>
        {/* <div style={styles.container}>
        <div style={styles.whyPlay}>
          PoolTogether to Win<br />
          <Image src="/images/pooltogethertowin.png" height={200} width={200} alt="poolerson" /><br />
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            style={{
              color: 'black',
              height: '17px',
              marginRight: '8px',
            }}
          />
          Deposit to a Vault<br />
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            style={{
              color: 'black',
              height: '17px',
              marginRight: '8px',
            }}
          />
          Receive Tickets<br />
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            style={{
              color: 'black',
              height: '17px',
              marginRight: '8px',
            }}
          />
          Win Prizes<br />
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            style={{
              color: 'black',
              height: '17px',
              marginRight: '8px',
            }}
          />
          Withdraw Anytime
          <br />
        </div>
      </div> */}
        </>}
      </>
    );
  };

  const styles: { [key: string]: CSSProperties } = {
    slideEnter: {
      position: 'absolute',
      transform: 'translateX(100%)',
      transition: 'transform 0.5s',
    },
    slideActive: {
      transform: 'translateX(0)',
      transition: 'transform 0.5s',
    },
    slideExit: {
      transform: 'translateX(0)',
      transition: 'transform 0.5s',
    },
    slideExitActive: {
      transform: 'translateX(-100%)',
      transition: 'transform 0.5s',
    },
    container: {
      marginTop: "10px",
      backgroundColor: "#b4ccd1",
      padding: "20px",
      borderRadius: "10px",
      // marginTop: "10px",
      width: "350px",
      display: 'inline-block',
      ...({ '@media (min-width: 768px)': { display: 'inline-flex', minWidth: 'auto' } } as Partial<CSSProperties>),
    },
    header: {
      color: "black",
      fontSize: "18px",

      fontWeight: "420",
      marginBottom: "12px",
    },
    contentContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    vaultGrid: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "300px",
      margin: "0 auto",
      overflowY: "auto",
      maxHeight: "133px",  // Adjust the height as required
      padding: "6px",
      backgroundColor: "#fff",  // The white background now goes here instead of individual cards
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      position: "relative"
  },

  vaultCard: {
      display: "flex", 
      justifyContent: "space-between", 
      width: "100%",
      // borderBottom: "1px solid #eee",  
      padding: "3px",  // Adjust padding as per your visual requirements
  },

    vaultInfo: {
      marginRight: "8px",
      display: "flex",
      alignItems: "center",
      width: "80px",
    },
    symbol: {
      display: "flex",
      alignItems: "center",
      textAlign: "left",
      flexBasis: 0, // Set flexBasis to 0 to allow symbol to take up all available space
      marginRight: "5px",
    },
    address: {
      // Left-align address to other cards
      flex: 1,
      textAlign: "left",
      marginRight: "5px",
    },
    valueContainer: {
      display: "flex",
      alignItems: "center",
      textAlign: "right", // Right-align the value (.v)
    },
    value: {
      marginLeft: "5px", // Add some space between the symbol and the value
    },
    arrowsContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    arrowIcon: {
      height: "16px",
      marginTop: "5px",
      marginBottom: "5px",
    },
  };

  export default TopWinners;
