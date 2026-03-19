import React from 'react';

/**
 * Logo RR GMAO — R + Я entrelacés style Rolls-Royce
 * Police serif bold, RR en chrome doré, GMAO en bleu acier
 */
export default function RRLogo({ size = 44, showText = true }: { size?: number; showText?: boolean }) {
  const badgeW = Math.round(size * 1.5);
  const badgeH = Math.round(size * 1.0);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={badgeW} height={badgeH} viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Chrome doré — reflets métalliques multiples */}
          <linearGradient id="chromeGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6b4c00" />
            <stop offset="15%"  stopColor="#d4a017" />
            <stop offset="30%"  stopColor="#fff3a0" />
            <stop offset="45%"  stopColor="#e8b820" />
            <stop offset="60%"  stopColor="#b8880a" />
            <stop offset="78%"  stopColor="#f0d060" />
            <stop offset="100%" stopColor="#7a5500" />
          </linearGradient>

          {/* Bordure badge dorée */}
          <linearGradient id="borderGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#6b4c00" />
            <stop offset="35%"  stopColor="#e8c840" />
            <stop offset="65%"  stopColor="#fff3a0" />
            <stop offset="100%" stopColor="#8a6400" />
          </linearGradient>

          {/* GMAO — bleu acier platine */}
          <linearGradient id="steelBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c8e0f8" />
            <stop offset="45%"  stopColor="#5b9bd5" />
            <stop offset="100%" stopColor="#1e5fa0" />
          </linearGradient>
        </defs>

        {/* Fond badge noir profond */}
        <rect x="0.5" y="0.5" width="89" height="59" rx="5" fill="#06090f" stroke="url(#borderGold)" strokeWidth="1.5"/>
        {/* Double bordure intérieure fine */}
        <rect x="3" y="3" width="84" height="54" rx="3.5" fill="none" stroke="#c9a23635" strokeWidth="0.6"/>

        {/* ── R normal (gauche) ── */}
        <text
          x="10" y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="38"
          fontWeight="700"
          fill="url(#chromeGold)"
          letterSpacing="-1"
        >R</text>

        {/* ── Я miroir (droite) — transform: flip horizontal ── */}
        {/* R en Georgia 38px ≈ 26px large. On place le Я qui chevauche le R. */}
        {/* translate(82,0) scale(-1,1) : x=10 → 82-10=72, x=36 → 82-36=46 → Я de x=46 à x=72 */}
        <text
          x="10" y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="38"
          fontWeight="700"
          fill="url(#chromeGold)"
          letterSpacing="-1"
          transform="translate(82, 0) scale(-1, 1)"
        >R</text>

        {/* Ligne séparatrice fine entre RR et GMAO */}
        <line x1="8" y1="49" x2="82" y2="49" stroke="url(#borderGold)" strokeWidth="0.7" opacity="0.5"/>

        {/* GMAO centré et entièrement visible */}
        <text
          x="45" y="57"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="9"
          fontWeight="700"
          fill="url(#steelBlue)"
          letterSpacing="4"
        >GMAO</text>
      </svg>

      {showText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            background: 'linear-gradient(180deg, #fff3a0 0%, #e8b820 40%, #b8880a 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '1px', fontFamily: 'Georgia, serif',
          }}>RR GMAO</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 3 }}>Espace Manager</span>
        </span>
      )}
    </span>
  );
}

export function RRLogoBadge({ size = 36 }: { size?: number }) {
  return <RRLogo size={size} showText={false} />;
}
