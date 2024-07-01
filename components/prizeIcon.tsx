import Image from 'next/image';
interface PrizeTokenProps {
    size: number;
  }
  
  const PrizeIcon: React.FC<PrizeTokenProps> = ({ size }) => {
  return (
    <Image
      src="/images/eth.png"
      alt="Token Image"
      width={size}
      height={size}
    />
  );
};

export default PrizeIcon;
