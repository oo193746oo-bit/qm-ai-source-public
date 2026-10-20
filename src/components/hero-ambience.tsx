"use client";

export function HeroAmbience({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
      className={`pointer-events-none absolute inset-0 h-full w-full select-none object-cover ${className}`}
    />
  );
}