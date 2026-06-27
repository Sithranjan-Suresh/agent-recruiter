const TONE = {
  ink: 'border-ink/30 text-ink',
  stamp: 'border-stamp/40 text-stamp-dark',
  seal: 'border-seal/40 text-seal',
  muted: 'border-ink-soft/20 text-ink-soft',
};

export default function StampBadge({ children, tone = 'ink', className = '' }) {
  return (
    <span
      className={`eyebrow inline-block border-[1.5px] rounded-sm px-2 py-1 -rotate-2 select-none ${TONE[tone]} ${className}`}
      style={{ fontWeight: 600 }}
    >
      {children}
    </span>
  );
}
