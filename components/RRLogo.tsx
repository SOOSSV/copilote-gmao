import React from 'react';

export default function RRLogo({ size = 44, showText = true }: { size?: number; showText?: boolean }) {
  const badgeW = Math.round(size * 1.6);
  const badgeH = Math.round(size * 1.05);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={badgeW} height={badgeH} viewBox="0 0 100 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6b4c00" />
            <stop offset="18%"  stopColor="#d4a820" />
            <stop offset="32%"  stopColor="#fff5b0" />
            <stop offset="50%"  stopColor="#e0b020" />
            <stop offset="68%"  stopColor="#a87800" />
            <stop offset="82%"  stopColor="#f0d868" />
            <stop offset="100%" stopColor="#6b4c00" />
          </linearGradient>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#5a3d00" />
            <stop offset="40%"  stopColor="#e8c840" />
            <stop offset="70%"  stopColor="#fff5b0" />
            <stop offset="100%" stopColor="#7a5800" />
          </linearGradient>
          <linearGradient id="sb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#d0e8ff" />
            <stop offset="50%"  stopColor="#5b9bd5" />
            <stop offset="100%" stopColor="#1a5090" />
          </linearGradient>
        </defs>

        {/* Badge */}
        <rect x="0.5" y="0.5" width="99" height="57" rx="5" fill="#06090f" stroke="url(#bg)" strokeWidth="1.5"/>
        <rect x="3"   y="3"   width="94" height="52" rx="3.5" fill="none" stroke="#c9a23630" strokeWidth="0.6"/>

        {/*
          R normal  : x=24 → droite ≈ x=50 (glyph ~26px à font-size 36)
          Я miroir  : translate(96,0) scale(-1,1)
                      → x=24 apparaît à 96-24=72, droite x=50 → 96-50=46
                      → Я occupe x=46 à x=72
          Chevauchement : x=46 à x=50 (4px)
          Centrage total : (24+72)/2 = 48 ≈ 50 ✓
        */}

        {/* R normal */}
        <text
          x="24" y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="36"
          fontWeight="700"
          fill="url(#cg)"
        >R</text>

        {/* Я miroir */}
        <text
          x="24" y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="36"
          fontWeight="700"
          fill="url(#cg)"
          transform="translate(96, 0) scale(-1, 1)"
        >R</text>

        {/* Séparateur */}
        <line x1="10" y1="49" x2="90" y2="49" stroke="url(#bg)" strokeWidth="0.6" opacity="0.6"/>

        {/* GMAO centré */}
        <text
          x="50" y="56"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="8.5"
          fontWeight="700"
          fill="url(#sb)"
          letterSpacing="4"
        >GMAO</text>
      </svg>

      {showText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: 15, fontWeight: 800,
            background: 'linear-gradient(180deg, #fff5b0 0%, #e0b020 45%, #a87800 100%)',
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
