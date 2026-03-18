const types: Record<string, { label: string; color: string }> = {
  corrective:   { label: 'Correctif',    color: '#ef4444' },
  preventive:   { label: 'Préventif',    color: '#2563eb' },
  ameliorative: { label: 'Amélioratif',  color: '#7c3aed' },
};

export default function TypeBadge({ type }: { type: string }) {
  const t = types[type] || { label: type, color: '#8b8fa8' };
  return (
    <span style={{
      background: `${t.color}22`,
      color: t.color,
      border: `1px solid ${t.color}44`,
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {t.label}
    </span>
  );
}
