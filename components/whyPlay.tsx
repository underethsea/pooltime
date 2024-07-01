import React, { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

const WhyPlay: React.FC = () => {
  return (
    <div style={styles.container} className="app-container-desktop">
      <div style={styles.whyPlay}><br></br>
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
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    backgroundColor: "#b4ccd1",
    padding: "24px 20px 20px 20px",
    marginTop: "10px",
    borderRadius: "10px",
    width: "350px",
    display: 'inline-block',
    ...({ '@media (min-width: 768px)': { display: 'inline-flex', minWidth: 'auto' } } as Partial<CSSProperties>),
  },
  whyPlay: {
    backgroundColor: "#e5f3f5",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    width: "100%",
    minWidth: "280px",
    height:"370px",
    fontSize: "19px",
    // marginBottom: "5px",
    // paddingTop: "10px",
    // marginTop: "10px",
  }
};

export default WhyPlay;
