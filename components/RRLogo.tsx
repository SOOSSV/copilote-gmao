import React from 'react';

/**
 * Logo RR GMAO — Phénix héraldique
 * Couronne · Ailes phénix · Cercle RR · Flammes · Griffes tenant GMAO
 */
export default function RRLogo({ size = 120, showText = false }: { size?: number; showText?: boolean }) {
  const w = Math.round(size * 1.0);
  const h = Math.round(size * 1.11);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={w} height={h} viewBox="0 0 280 310" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Chrome doré vertical */}
          <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#5C3D00"/>
            <stop offset="14%"  stopColor="#C89010"/>
            <stop offset="28%"  stopColor="#FFF090"/>
            <stop offset="46%"  stopColor="#DDA818"/>
            <stop offset="62%"  stopColor="#906400"/>
            <stop offset="80%"  stopColor="#ECC840"/>
            <stop offset="100%" stopColor="#5C3D00"/>
          </linearGradient>
          {/* Chrome doré horizontal (ailes) */}
          <linearGradient id="gH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4A3000"/>
            <stop offset="20%"  stopColor="#B88010"/>
            <stop offset="40%"  stopColor="#FFF090"/>
            <stop offset="60%"  stopColor="#C89010"/>
            <stop offset="82%"  stopColor="#906000"/>
            <stop offset="100%" stopColor="#4A3000"/>
          </linearGradient>
          {/* Bleu acier (GMAO) */}
          <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D8EEFF"/>
            <stop offset="50%"  stopColor="#5090D0"/>
            <stop offset="100%" stopColor="#184888"/>
          </linearGradient>
        </defs>

        {/* ══════════════ COURONNE ══════════════ */}
        {/* Corps de la couronne */}
        <path d="M 110,102 L 116,82 L 126,93 L 140,66 L 154,93 L 164,82 L 170,102 Z" fill="url(#gV)"/>
        {/* Base de la couronne */}
        <rect x="108" y="99" width="64" height="11" rx="2" fill="url(#gV)"/>
        {/* Petits arcs décoratifs dans la base */}
        <path d="M 112,99 Q 120,93 128,99"  fill="none" stroke="url(#gV)" strokeWidth="1.2" opacity="0.7"/>
        <path d="M 132,99 Q 140,93 148,99"  fill="none" stroke="url(#gV)" strokeWidth="1.2" opacity="0.7"/>
        <path d="M 152,99 Q 160,93 168,99"  fill="none" stroke="url(#gV)" strokeWidth="1.2" opacity="0.7"/>
        {/* Perles sur les pointes */}
        <circle cx="116" cy="80"  r="3.8" fill="url(#gV)"/>
        <circle cx="140" cy="64"  r="4.8" fill="url(#gV)"/>
        <circle cx="164" cy="80"  r="3.8" fill="url(#gV)"/>

        {/* ══════════════ AILE GAUCHE (6 plumes) ══════════════ */}
        {/* Plume 1 — haute, vers haut-gauche */}
        <path d="M 84,140 C 60,124 32,106 8,88   C 30,102 60,120 82,138 Z" fill="url(#gH)" opacity="1"/>
        {/* Plume 2 */}
        <path d="M 82,150 C 56,136 28,120 4,104  C 28,116 58,132 80,148 Z" fill="url(#gH)" opacity="0.92"/>
        {/* Plume 3 — horizontale */}
        <path d="M 82,160 C 54,153 26,148 2,144  C 28,148 58,153 80,158 Z" fill="url(#gH)" opacity="0.85"/>
        {/* Plume 4 — légèrement bas */}
        <path d="M 83,169 C 55,168 26,170 2,176  C 28,170 58,167 82,168 Z" fill="url(#gH)" opacity="0.76"/>
        {/* Plume 5 — bas-gauche */}
        <path d="M 85,177 C 58,182 30,192 8,205  C 32,192 64,182 88,176 Z" fill="url(#gH)" opacity="0.65"/>
        {/* Plume 6 — très basse */}
        <path d="M 88,184 C 62,194 36,207 14,222 C 40,208 72,196 92,186 Z" fill="url(#gH)" opacity="0.50"/>

        {/* ══════════════ AILE DROITE (miroir) ══════════════ */}
        <g transform="translate(280,0) scale(-1,1)">
          <path d="M 84,140 C 60,124 32,106 8,88   C 30,102 60,120 82,138 Z" fill="url(#gH)" opacity="1"/>
          <path d="M 82,150 C 56,136 28,120 4,104  C 28,116 58,132 80,148 Z" fill="url(#gH)" opacity="0.92"/>
          <path d="M 82,160 C 54,153 26,148 2,144  C 28,148 58,153 80,158 Z" fill="url(#gH)" opacity="0.85"/>
          <path d="M 83,169 C 55,168 26,170 2,176  C 28,170 58,167 82,168 Z" fill="url(#gH)" opacity="0.76"/>
          <path d="M 85,177 C 58,182 30,192 8,205  C 32,192 64,182 88,176 Z" fill="url(#gH)" opacity="0.65"/>
          <path d="M 88,184 C 62,194 36,207 14,222 C 40,208 72,196 92,186 Z" fill="url(#gH)" opacity="0.50"/>
        </g>

        {/* ══════════════ CERCLE RR ══════════════ */}
        {/* Halo extérieur */}
        <circle cx="140" cy="158" r="66" fill="none" stroke="url(#gV)" strokeWidth="0.7" opacity="0.35"/>
        {/* Anneau extérieur */}
        <circle cx="140" cy="158" r="60" fill="none" stroke="url(#gV)" strokeWidth="2.8"/>
        {/* Fond */}
        <circle cx="140" cy="158" r="56" fill="#04070D"/>
        {/* Anneau intérieur */}
        <circle cx="140" cy="158" r="53" fill="none" stroke="url(#gV)" strokeWidth="1"/>

        {/* ══════════════ R  +  Я ══════════════ */}
        {/* R normal — centré à x=114 */}
        <text
          x="114" y="181"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="44"
          fontWeight="700"
          fill="url(#gV)"
        >R</text>
        {/*
          Я miroir centré à x=166
          transform="translate(332,0) scale(-1,1)"  → 2×166=332
          x=166 → -166+332=166 ✓  centre reste à 166
        */}
        <text
          x="166" y="181"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="44"
          fontWeight="700"
          fill="url(#gV)"
          transform="translate(332,0) scale(-1,1)"
        >R</text>

        {/* ══════════════ FLAMMES DU PHÉNIX (queue) ══════════════ */}
        {/* Flamme centrale G */}
        <path d="M 136,218 C 131,232 124,250 128,270 C 130,253 133,235 136,218 Z" fill="url(#gV)" opacity="0.88"/>
        {/* Flamme centrale D */}
        <path d="M 144,218 C 149,232 156,250 152,270 C 150,253 147,235 144,218 Z" fill="url(#gV)" opacity="0.88"/>
        {/* Flamme inter G */}
        <path d="M 128,223 C 120,238 114,256 118,276 C 120,258 124,240 128,223 Z" fill="url(#gV)" opacity="0.72"/>
        {/* Flamme inter D */}
        <path d="M 152,223 C 160,238 166,256 162,276 C 160,258 156,240 152,223 Z" fill="url(#gV)" opacity="0.72"/>
        {/* Flamme ext G */}
        <path d="M 120,228 C 108,246 103,266 107,284 C 109,267 113,248 120,228 Z" fill="url(#gV)" opacity="0.50"/>
        {/* Flamme ext D */}
        <path d="M 160,228 C 172,246 177,266 173,284 C 171,267 167,248 160,228 Z" fill="url(#gV)" opacity="0.50"/>

        {/* ══════════════ PATTES / SERRES ══════════════ */}
        {/* Tibia gauche */}
        <line x1="116" y1="272" x2="124" y2="282" stroke="url(#gV)" strokeWidth="3" strokeLinecap="round"/>
        {/* Griffe G-1 */}
        <path d="M 108,283 C 103,289 102,297 106,303" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Griffe G-2 */}
        <path d="M 117,284 C 113,291 113,299 118,305" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Griffe G-3 */}
        <path d="M 126,284 C 124,292 125,300 130,305" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Pied gauche horizontal */}
        <path d="M 105,283 C 108,280 122,280 128,283" fill="none" stroke="url(#gV)" strokeWidth="2.2" strokeLinecap="round"/>

        {/* Tibia droit */}
        <line x1="164" y1="272" x2="156" y2="282" stroke="url(#gV)" strokeWidth="3" strokeLinecap="round"/>
        {/* Griffe D-1 */}
        <path d="M 172,283 C 177,289 178,297 174,303" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Griffe D-2 */}
        <path d="M 163,284 C 167,291 167,299 162,305" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Griffe D-3 */}
        <path d="M 154,284 C 156,292 155,300 150,305" fill="none" stroke="url(#gV)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Pied droit horizontal */}
        <path d="M 175,283 C 172,280 158,280 152,283" fill="none" stroke="url(#gV)" strokeWidth="2.2" strokeLinecap="round"/>

        {/* ══════════════ GMAO ══════════════ */}
        {/* Ligne décorative */}
        <path d="M 92,296 C 110,292 128,290 140,290 C 152,290 170,292 188,296"
          stroke="url(#gV)" strokeWidth="0.9" fill="none" opacity="0.65"/>
        <text
          x="140" y="309"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="15"
          fontWeight="700"
          fill="url(#gB)"
          letterSpacing="7"
        >GMAO</text>
      </svg>

      {showText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, fontFamily: 'Georgia, serif', letterSpacing: '2px',
            background: 'linear-gradient(180deg, #FFF090 0%, #DDA818 45%, #906400 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>RR GMAO</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 3 }}>
            Espace Manager
          </span>
        </span>
      )}
    </span>
  );
}

export function RRLogoBadge({ size = 55 }: { size?: number }) {
  return <RRLogo size={size} showText={false} />;
}
