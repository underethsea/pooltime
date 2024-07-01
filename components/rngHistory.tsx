import React from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Eighteener } from '../utils/tokenMaths';
import PrizeIcon from './prizeIcon';
import {ADDRESS,CONFIG} from '../constants/'

interface RngHistoryProps {
  events: [];
}

  const RngHistoryComponent: React.FC<RngHistoryProps> = ({ events }) => {
   let reversedEvents
if(events){reversedEvents = [...events].reverse();}


  // // Calculating Total Costs
  // let totalGasCost = ethers.BigNumber.from(0);
  // let totalLinkPayment = ethers.BigNumber.from(0);
  // let totalRelayGasCost = ethers.BigNumber.from(0);

  // rngHistory.forEach(event => {
  //   totalGasCost = totalGasCost.add(event.gasCost);
  //   totalLinkPayment = totalLinkPayment.add(event.linkPayment);
  //   totalRelayGasCost = totalRelayGasCost.add(event.relayGasCost);
  // });

  // // Computing Averages
  // const averageGasCost = totalGasCost.div(rngHistory.length);
  // const averageLinkPayment = totalLinkPayment.div(rngHistory.length);
  // const averageRelayGasCost = totalRelayGasCost.div(rngHistory.length);

  
    return (reversedEvents && reversedEvents.length > 0 &&
      <><br></br>
       {/* <div className="stats" style={{ color: "white" }}> */}

                    {/* <div className="stat">
                      Avg RNG<br></br>
                      <span className="stat-value">
                        <span><Image
                          src={"/images/eth.png"}
                          className="emoji"
                          alt="r"
                          width={25}
                          height={25}
                        />&nbsp;{Eighteener(averageGasCost)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="stats" style={{ color: "white" }}>
                    <div className="stat">
                      Avg Link<br></br>
                      <span className="stat-value">
                        <span><Image
                          src={"/images/link.webp"}
                          className="emoji"
                          alt="r"
                          width={25}
                          height={25}
                        />&nbsp;{Eighteener(averageLinkPayment)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="stats" style={{ color: "white" }}>
                    <div className="stat">
                      Avg Relay<br></br>
                      <span className="stat-value">
                        <span><Image
                          src={"/images/eth.png"}
                          className="emoji"
                          alt="r"
                          width={25}
                          height={25}
                        />&nbsp;{Eighteener(averageRelayGasCost)}</span>
                      </span>
                    </div> */}
                  {/* </div> */}


    <br></br><br></br>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '15px',
        // backgroundColor: '#dfecfa',
        backgroundColor: '#e9effb',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '100%', // Set to the desired width
        maxWidth: '450px', // Set to the maximum width you want
        minWidth: '380px',
        margin: 'auto'
        }}>
        {reversedEvents.map((event:any, index) => (
          <div key={event.drawStarted.transactionHash} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            borderTop: index > 0 ? '3px solid #1a4160' : undefined, 
            paddingTop: index > 0 ? '15px' : '5px', 

          }}>
            <div style={{ width: '10%', textAlign: 'left' }}>
              <div style={{ fontSize: '24px', marginLeft: '10px' }}>#
              {event.drawStarted.drawId}
              </div>
            </div>
            <div style={{ width: '45%', textAlign: 'right', fontSize: '15px' }}>
              <div style={{ marginBottom: '4px' }}>
                <a href={`${ADDRESS[CONFIG.CHAINNAME].ETHERSCAN}/tx/${event.drawStarted.transactionHash}`}>
                  <Image
                    src="/images/etherscan.svg"
                    height={12}
                    width={12}
                    alt="etherscan"
                  />
                &nbsp;RNG</a>
              </div>
              {/* {event.} */}
              {event.drawStarted &&
              <div>
                <span style={{ fontSize: '17px' }}>
                <PrizeIcon size={14}/>&nbsp;
                {Eighteener(event.drawStarted.reward)}
                </span>
              </div>}
              <div>
                <span style={{ fontSize: '20px' }}>
                  {/* <Image
                    src="/images/eth.png"
                    alt="Token Image"
                    width={16}
                    height={16}
                  />  */}
                  {/* {Eighteener(event.drawStarted.totalCost)} */}
                </span>
              </div>
              
            </div>
            <div style={{ width: '45%', textAlign: 'right', paddingRight: '10px' }}>
              {event.drawFinished.reward > 0   &&       <>  
              <div style={{ marginBottom: '4px', fontSize: '15px'}}>
              <a href={`${ADDRESS[CONFIG.CHAINNAME].ETHERSCAN}/tx/${event.drawFinished.transactionHash}`}>
                  <Image
                    src="/images/etherscan.svg"
                    height={12}
                    width={12}
                    alt="etherscan"
                  />
              &nbsp;
                DRAW  </a></div>
                {event.drawFinished.reward > 0 &&
                <div>
                <span style={{ fontSize: '17px' }}>
                <PrizeIcon size={14}/>&nbsp;{Eighteener(event.drawFinished.reward)}
                </span>
              </div>}
              <div>
                <span style={{ fontSize: '20px' }}>
                  {/* <Image
                    src="/images/eth.png"
                    alt="Token Image"
                    width={16}
                    height={16}
                  /> */}
                   {/* {Eighteener(event.drawFinished.gasCost)} */}
                </span>
              </div></> }
            </div>
          </div>
        ))}
      </div></>
    );
  };

export default RngHistoryComponent;
