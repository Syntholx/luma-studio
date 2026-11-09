import { useState } from "react";

export function ProductImage(props: {
  imageUrl: string;
  imageAlt: string;
  className?: string;
}) {
  const [imageStage, setImageStage] = useState<
    "original" | "fallback" | "unavailable"
  >("original");

  if (imageStage === "unavailable") {
    return (
      <div
        className={`${props.className ?? ""} bg-[#eee8e1] text-center flex flex-col items-center justify-center`}
      >
        <p>Zdjęcie niedostępne</p>
      </div>
    );
  }

  return (
    <img
      className={props.className}
      src={
        imageStage === "original"
          ? props.imageUrl
          : "/images/products/product-fallback.png"
      }
      alt={imageStage === "original" ? props.imageAlt : "Zdjęcie niedostępne"}
      onError={() => {
        if (imageStage === "original") setImageStage("fallback");
        else {
          setImageStage("unavailable");
        }
      }}
    />
  );
}
