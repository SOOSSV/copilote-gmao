const types: Record<string, { label: string; color: string; bg: string; border: string }> = {
  corrective:   { label: 'Correctif',   color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/25' },
  preventive:   { label: 'Préventif',   color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  ameliorative: { label: 'Amélioratif', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/25' },
};

export default function TypeBadge({ type }: { type: string }) {
  const t = types[type] || { label: type, color: 'text-[#8b8fa8]', bg: 'bg-[#8b8fa8]/10', border: 'border-[#8b8fa8]/25' };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.5px] ${t.color} ${t.bg} ${t.border}`}>
      {t.label}
    </span>
  );
}
