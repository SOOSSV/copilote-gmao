const colors: Record<string, string> = {
  urgente: '#ef4444',
  haute:   '#f59e0b',
  normale: '#6366f1',
  basse:   '#22c55e',
};

export default function PrioriteBadge({ priorite }: { priorite: string }) {
  const color = colors[priorite] || '#8b8fa8';
  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {priorite}
    </span>
  );
}
