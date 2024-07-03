import React, { useEffect, useState } from "react";
import Layout from "./index"; 
import Image from "next/image";
import PrizeValueIcon from "../components/prizeValueIcon";
import PrizeValue from "../components/prizeValue";
import Wins from "../components/LeaderboardWins"

interface Winner {
  p: string;
  draws: string;
  prizes: string;
  won: string;
}

const Leaderboard: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://poolexplorer.xyz/prizeleaderboard`);
        const data = await response.json();
        setWinners(data); 
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchData();
  }, []);

  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
  };

  const handleCloseModal = () => {
    setSelectedAddress(null);
  };

  const filteredWinners = searchQuery.length === 0
    ? winners
    : winners.filter((winner) =>
        winner.p.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Image src={`/images/divingboard.png`} height={100} width={100} alt="liquidator" />
        <h1 style={{ margin: "0 0 0 10px", lineHeight: "50px" }}>WINNER LEADERBOARD</h1>
      </div>
      <br />
      <center>
        <div className="vault-search-container">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vaultsearch"
            placeholder="Search by Pooler Address"
          />
        </div>
        <br />
        <div className="draw-history">
          <table className="draw-table">
            <thead>
              <tr>
                <th className="hidden-mobile">Rank</th>
                <th>Pooler</th>
                <th className="hidden-mobile">Draws Won</th>
                <th className="hidden-mobile">Prizes Won</th>
                <th style={{ textAlign: "right" }}>Prizes</th>
              </tr>
            </thead>
            <tbody>
              {filteredWinners.map((winner, index) => (
                <tr key={winner.p} onClick={() => handleAddressClick(winner.p)} style={{ cursor: "pointer" }}>
                  <td className="hidden-mobile">{index + 1}</td>
                  <td className="hidden-mobile">{winner.p}</td>
                  <td className="hidden-desktop">{winner.p.slice(0, 15)}</td>
                  <td className="hidden-mobile">{winner.draws}</td>
                  <td className="hidden-mobile">{winner.prizes}</td>
                  <td className="amount" style={{ textAlign: "right" }}>
                    <PrizeValueIcon size={20} />
                    <PrizeValue amount={BigInt(winner.won)} size={20} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </center>
      {selectedAddress && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          {/* <div  onClick={(e) => e.stopPropagation()}> */}
            <Wins addressProp={selectedAddress} />
          {/* </div> */}
        </div>
      )}
    </Layout>
  );
};

const styles: any = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "600px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 1001,
    overflow: "auto", // Ensure scroll if content overflows
  },
};

export default Leaderboard;
