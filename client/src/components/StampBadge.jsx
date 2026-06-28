const TONE = {
  ink: 'border-ink/40 text-ink',
  stamp: 'border-stamp/50 text-stamp-dark',
  seal: 'border-seal/50 text-seal',
  muted: 'border-ink-soft/25 text-ink-soft',
};

export default function StampBadge({ children, tone = 'ink', className = '' }) {
  return (
    <span
      className={`eyebrow inline-block border-2 rounded-[2px] px-2 py-1 -rotate-2 select-none ${TONE[tone]} ${className}`}
      style={{
        fontWeight: 700,
        boxShadow: 'inset 0 0 0 1px currentColor',
        opacity: 0.92,
      }}
    >
      {children}
    </span>
  );
}
