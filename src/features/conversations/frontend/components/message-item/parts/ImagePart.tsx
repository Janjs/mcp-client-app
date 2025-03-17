import React from "react";

interface ImagePartProps {
  image: URL | string;
}

/**
 * Renders an image in a message
 */
export const ImagePart: React.FC<ImagePartProps> = ({ image }) => {
  const imgSrc = image instanceof URL 
    ? image.toString() 
    : "data:image/png;base64," + image;

  return (
    <div className="my-2">
      <img
        src={imgSrc}
        alt="Message attachment"
        className="max-w-full rounded"
      />
    </div>
  );
}; 