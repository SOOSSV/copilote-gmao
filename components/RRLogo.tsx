import React from 'react';

/**
 * Logo RR GMAO — inspiré du monogramme Rolls-Royce
 * RR en dégradé chrome doré, GMAO en bleu acier
 */
export default function RRLogo({ size = 44, showText = true }: { size?: number; showText?: boolean }) {
  const badgeW = Math.round(size * 1.1);
  const badgeH = Math.round(size * 0.72);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={badgeW} height={badgeH} viewBox="0 0 55 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Chrome doré — effet reflet métallique */}
          <linearGradient id="chromeGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7a5c10" />
            <stop offset="18%"  stopColor="#e8c84a" />
            <stop offset="35%"  stopColor="#fff7c0" />
            <stop offset="50%"  stopColor="#f5d060" />
            <stop offset="70%"  stopColor="#c49a20" />
            <stop offset="85%"  stopColor="#ffe680" />
            <stop offset="100%" stopColor="#8a6800" />
          </linearGradient>

          {/* Bordure badge — chrome doré fin */}
          <linearGradient id="borderGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#8a6800" />
            <stop offset="30%"  stopColor="#f5d060" />
            <stop offset="60%"  stopColor="#fff7c0" />
            <stop offset="100%" stopColor="#9a7800" />
          </linearGradient>

          {/* GMAO — bleu acier / platine */}
          <linearGradient id="steelBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a8c8f0" />
            <stop offset="40%"  stopColor="#5b9bd5" />
            <stop offset="100%" stopColor="#2a6aad" />
          </linearGradient>
        </defs>

        {/* Fond badge */}
        <rect x="0.5" y="0.5" width="54" height="35" rx="4" fill="#080c12" stroke="url(#borderGold)" strokeWidth="1.3"/>
        {/* Ligne intérieure fine */}
        <rect x="2.5" y="2.5" width="50" height="31" rx="2.5" fill="none" stroke="#c9a23630" strokeWidth="0.5"/>

        {/* R gauche — chrome doré */}
        <g fill="url(#chromeGold)">
          <rect x="8" y="8" width="3.5" height="20" rx="0.5"/>
          <path d="M11.5 8 Q22 8 22 13.5 Q22 19 11.5 19 L11.5 16.5 Q19 16.5 19 13.5 Q19 10.5 11.5 10.5 Z"/>
          <path d="M13 19 L22 28 L19 28 L10.5 19.5 Z"/>
        </g>

        {/* R droite — chrome doré légèrement décalé */}
        <g fill="url(#chromeGold)" opacity="0.9">
          <rect x="23" y="8" width="3.5" height="20" rx="0.5"/>
          <path d="M26.5 8 Q37 8 37 13.5 Q37 19 26.5 19 L26.5 16.5 Q34 16.5 34 13.5 Q34 10.5 26.5 10.5 Z"/>
          <path d="M28 19 L37 28 L34 28 L25.5 19.5 Z"/>
        </g>

        {/* GMAO — bleu acier */}
        <text
          x="46" y="30"
          fontFamily="Georgia, serif"
          fontSize="7.5"
          fontWeight="700"
          fill="url(#steelBlue)"
          letterSpacing="0.8"
          textAnchor="middle"
        >GMAO</text>
      </svg>

      {showText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            background: 'linear-gradient(180deg, #fff7c0 0%, #f5d060 40%, #c49a20 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '1px', fontFamily: 'Georgia, serif',
          }}>RR GMAO</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Espace Manager</span>
        </span>
      )}
    </span>
  );
}

export function RRLogoBadge({ size = 36 }: { size?: number }) {
  return <RRLogo size={size} showText={false} />;
}
