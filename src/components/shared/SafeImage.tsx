import { useState, type ImgHTMLAttributes } from "react";

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

const DEFAULT_FALLBACK = "/placeholder.svg";

export function SafeImage({
  src,
  fallback = DEFAULT_FALLBACK,
  alt = "",
  className,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => { setImgSrc(fallback); setFailed(true); }}
      {...props}
    />
  );
}
