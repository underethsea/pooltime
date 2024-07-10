import React from "react";
import { ICONS } from "../constants/address";

interface IconProps {
  name: string;
  size?: number; // Optional size property
  alignment?: "bottom" | "middle"; // Optional alignment property
}

const IconDisplay: React.FC<IconProps> = ({ name, size, alignment = "bottom" }) => {
  const names = name.toLowerCase().split(/[ -/]+/);
  const iconUrls = names
    .filter((name) => ICONS[name])
    .map((name) => ICONS[name]);

  // Define custom styles based on the size prop
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : {};

  // Determine the class name based on the alignment prop
  const containerClassName = alignment === "middle" ? "iconcontainer iconcontainer-verticalcenter" : "iconcontainer";

  return (
    <span className={containerClassName}>
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
