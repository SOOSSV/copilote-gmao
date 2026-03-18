const styles: Record<string, { color: string; bg: string; border: string }> = {
  urgente: { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/25' },
  haute:   { color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/25' },
  normale: { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/25' },
  basse:   { color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/25' },
};

export default function PrioriteBadge({ priorite }: { priorite: string }) {
  const s = styles[priorite] || { color: 'text-[#8b8fa8]', bg: 'bg-[#8b8fa8]/10', border: 'border-[#8b8fa8]/25' };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.5px] ${s.color} ${s.bg} ${s.border}`}>
      {priorite}
    </span>
  );
}
