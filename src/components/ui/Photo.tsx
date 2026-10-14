import { useState } from "react";
import type { PhotoProps } from "@/models";
import { img } from "@/data/photos";

/** Remote photo with a neutral placeholder and a fade-in once loaded. */
export function Photo({ id, alt, w = 900, className = "", eager, position }: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className={`block overflow-hidden bg-surface-2 ${className}`}>
      {!failed && (
        <img
          src={img(id, w)}
          srcSet={`${img(id, Math.round(w * 0.6))} ${Math.round(w * 0.6)}w, ${img(id, w)} ${w}w, ${img(id, w * 2)} ${w * 2}w`}
          sizes="(min-width: 1024px) 40vw, 90vw"
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={position ? { objectPosition: position } : undefined}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </span>
  );
}
