import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: 'var(--border)', lineHeight: 1, marginBottom: 16 }}>404</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Page introuvable</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 320 }}>
        Cette page n'existe pas ou a été déplacée.
      </div>
      <Link href="/" style={{
        background: '#2563eb', color: '#fff', borderRadius: 10,
        padding: '12px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none',
      }}>
        Retour à l'accueil
      </Link>
    </div>
  );
}
