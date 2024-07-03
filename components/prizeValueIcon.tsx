import Image from "next/image";
import { useOverview } from "./contextOverview";
interface PrizeValueIconProps {
  size: number;
}

const PrizeValueIcon: React.FC<PrizeValueIconProps> = ({ size }) => {
  const { currency, overview } = useOverview();

  if (currency === "ETH") {
    return (
      <span style={{ marginRight: "5px" }}>
        <Image
          src="/images/eth.png"
          alt="ETH"
          width={Math.round(size * 0.75)}
          height={Math.round(size * 0.75)}
        />
      </span>
    );
  } else {
    const fontSize = size.toString() + "px";
    return <span style={{ fontSize: fontSize }}>$</span>;
  }
};

export default PrizeValueIcon;
