// IconDisplay.tsx
import React from "react";
import { ICONS } from "../constants/address"
interface IconProps {
  name: string;
  size?: number; // Optional size property
}


const IconDisplay: React.FC<IconProps> = ({ name, size }) => {
  const names = name.toLowerCase().split(/[ -/]+/);
  const iconUrls = names
    .filter((name) => ICONS[name])
    .map((name) => ICONS[name]);

  // Define custom styles based on the size prop
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : {};

  return (
    <span className="iconcontainer">
      {iconUrls.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`${name} icon`}
          className="icon"
          style={{ ...customStyle, zIndex: iconUrls.length - index }} 
        />
      ))}
    </span>
  );
};

export default IconDisplay;
