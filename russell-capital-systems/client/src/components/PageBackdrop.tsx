/**
 * Full-bleed city photograph behind the top of a public page.
 *
 * The photo stretches edge to edge (`object-cover`, no letterboxing) and
 * fades into the page's own background colour so the heading and the first
 * band of content sit on the picture, not beside it. Give the wrapper
 * `relative` and the page content `relative z-10`.
 *
 * `phoneSrc` is an optional portrait cut served under 768px so a tall screen
 * gets a tall picture instead of a sliver of a landscape one.
 */
export default function PageBackdrop({
  src,
  phoneSrc,
  alt,
  fade,
  position = "center",
  brightness = ".58",
}: {
  src: string;
  phoneSrc?: string;
  alt: string;
  /** The page background colour the photo fades into (hex or rgb). */
  fade: string;
  position?: string;
  brightness?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[62vh] max-h-[760px] min-h-[440px] overflow-hidden" data-testid="page-backdrop">
      <picture>
        {phoneSrc && <source media="(max-width: 767px)" srcSet={phoneSrc} />}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover saturate-[1.1]"
          style={{ objectPosition: position, filter: `brightness(${brightness})` }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, ${fade} 100%)` }}
      />
    </div>
  );
}
