import { useState } from "react";
import type { PhotoProps } from "@/models";
import { sized, srcSetFor } from "@/lib/media";

/** Photo URL with a neutral placeholder and a fade-in once loaded. A missing or broken URL shows the placeholder. */
export function Photo({ src, alt, w = 900, className = "", eager, position }: PhotoProps) {
  return (
    <span className={`block overflow-hidden bg-surface-2 ${className}`}>
      {/* Keyed by URL so a replaced photo (live edit) fades in fresh instead of reusing the old load state. */}
      {src ? <PhotoImage key={src} src={src} alt={alt} w={w} eager={eager} position={position} /> : null}
    </span>
  );
}

function PhotoImage({ src, alt, w, eager, position }: { src: string; alt: string; w: number; eager?: boolean; position?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={sized(src, w)}
      srcSet={srcSetFor(src, w)}
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
  );
}
