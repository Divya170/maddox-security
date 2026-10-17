/**
 * Image slot: the uploaded photo when there is one, otherwise the design's labelled
 * placeholder (the comp's <image-slot> with its placeholder text).
 */
export function Photo({ src, alt, label, dark, className = '', style }: { src?: string | null; alt: string; label: string; dark?: boolean; className?: string; style?: React.CSSProperties }) {
  const cls = ['ph', dark && 'ph--dark', className].filter(Boolean).join(' ');
  if (src) {
    return (
      <div className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={cls} role="img" aria-label={alt || label} style={style}>
      <div className="ph__ph">
        <span className="ph__label">{label}</span>
      </div>
    </div>
  );
}
