/** "DRAFT · …" label — only ever rendered in staff preview (drafts never reach public responses). */
export function DraftTag({ children = 'DRAFT', light }: { children?: React.ReactNode; light?: boolean }) {
  return <span className={`draft-tag${light ? ' draft-tag--light' : ''}`}>{children}</span>;
}
