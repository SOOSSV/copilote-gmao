import React from 'react';

export default function RRLogo({ size = 200, showText = false }: { size?: number; showText?: boolean }) {
  const w = Math.round(size);
  const h = Math.round(size * 1.13);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={w} height={h} viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#5C3D00"/>
            <stop offset="14%"  stopColor="#C89010"/>
            <stop offset="28%"  stopColor="#FFF090"/>
            <stop offset="46%"  stopColor="#DDA818"/>
            <stop offset="62%"  stopColor="#906400"/>
            <stop offset="80%"  stopColor="#ECC840"/>
            <stop offset="100%" stopColor="#5C3D00"/>
          </linearGradient>
          <linearGradient id="gH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3A2000"/>
            <stop offset="22%"  stopColor="#B88010"/>
            <stop offset="42%"  stopColor="#FFF090"/>
            <stop offset="62%"  stopColor="#C89010"/>
            <stop offset="82%"  stopColor="#906000"/>
            <stop offset="100%" stopColor="#3A2000"/>
          </linearGradient>
          <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D8EEFF"/>
            <stop offset="50%"  stopColor="#5090D0"/>
            <stop offset="100%" stopColor="#184888"/>
          </linearGradient>
          <linearGradient id="gFire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFF090"/>
            <stop offset="40%"  stopColor="#E8A010"/>
            <stop offset="100%" stopColor="#8B4500"/>
          </linearGradient>
        </defs>

        {/* ═══════════════ COURONNE ═══════════════ */}
        <path d="M 112,96 L 118,72 L 130,86 L 150,52 L 170,86 L 182,72 L 188,96 Z" fill="url(#gV)"/>
        <rect x="110" y="92" width="80" height="12" rx="2.5" fill="url(#gV)"/>
        <path d="M 115,92 Q 127,84 139,92" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 141,92 Q 150,84 159,92" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 161,92 Q 173,84 185,92" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="118" cy="70"  r="4.5" fill="url(#gV)"/>
        <circle cx="150" cy="49"  r="5.5" fill="url(#gV)"/>
        <circle cx="182" cy="70"  r="4.5" fill="url(#gV)"/>

        {/* ═══════════════ TÊTE DU PHÉNIX ═══════════════ */}
        {/* Cou */}
        <path d="M 142,118 C 140,110 140,106 144,102 C 148,98 152,98 156,102 C 160,106 160,110 158,118 Z"
          fill="url(#gV)" opacity="0.85"/>
        {/* Tête */}
        <ellipse cx="150" cy="126" rx="16" ry="20" fill="url(#gV)"/>
        {/* Bec */}
        <path d="M 155,112 L 162,103 L 158,114 Z" fill="url(#gV)"/>
        {/* Œil */}
        <circle cx="156" cy="122" r="3.5" fill="#06090f"/>
        <circle cx="157" cy="121" r="1.2" fill="url(#gV)"/>
        {/* Crête / plumes de tête */}
        <path d="M 148,108 C 142,96 138,82 142,70 C 143,82 144,94 148,108 Z" fill="url(#gV)" opacity="0.8"/>
        <path d="M 152,106 C 150,93 152,78 158,66 C 156,79 154,93 152,106 Z" fill="url(#gV)" opacity="0.7"/>
        <path d="M 145,109 C 136,98 130,84 134,72 C 136,84 139,97 145,109 Z" fill="url(#gV)" opacity="0.6"/>

        {/* ═══════════════ AILE GAUCHE — plumes dramatiques ═══════════════ */}
        {/* Plume 1 — pointe haute vers l'intérieur-haut */}
        <path d="
          M 134,158 C 126,138 114,112 108,82
          C 108,90 110,108 112,124 C 114,140 122,150 128,158 Z"
          fill="url(#gH)" opacity="0.95"/>
        {/* Plume 2 — vers haut */}
        <path d="
          M 126,163 C 112,142 94,115 82,78
          C 84,90 90,112 96,134 C 102,150 114,158 122,163 Z"
          fill="url(#gH)" opacity="0.92"/>
        {/* Plume 3 — vers haut-gauche */}
        <path d="
          M 118,170 C 98,148 72,118 50,78
          C 55,92 66,118 78,140 C 88,158 106,166 114,170 Z"
          fill="url(#gH)" opacity="0.88"/>
        {/* Plume 4 — vers gauche */}
        <path d="
          M 110,178 C 84,158 52,128 20,92
          C 28,107 46,132 65,152 C 78,166 98,175 106,178 Z"
          fill="url(#gH)" opacity="0.82"/>
        {/* Plume 5 — vers gauche bas */}
        <path d="
          M 104,186 C 74,168 40,142 8,110
          C 18,126 44,152 68,170 C 82,180 98,185 100,186 Z"
          fill="url(#gH)" opacity="0.74"/>
        {/* Plume 6 — presque horizontale */}
        <path d="
          M 100,194 C 68,180 34,160 4,132
          C 15,148 46,170 74,184 C 86,190 96,194 98,194 Z"
          fill="url(#gH)" opacity="0.62"/>
        {/* Plume 7 — enroulement vers le bas-gauche */}
        <path d="
          M 100,202 C 70,194 36,178 10,155
          C 20,170 52,188 78,198 C 88,202 96,202 98,202 Z"
          fill="url(#gH)" opacity="0.48"/>

        {/* ═══════════════ AILE DROITE (miroir parfait) ═══════════════ */}
        <g transform="translate(300,0) scale(-1,1)">
          <path d="
            M 134,158 C 126,138 114,112 108,82
            C 108,90 110,108 112,124 C 114,140 122,150 128,158 Z"
            fill="url(#gH)" opacity="0.95"/>
          <path d="
            M 126,163 C 112,142 94,115 82,78
            C 84,90 90,112 96,134 C 102,150 114,158 122,163 Z"
            fill="url(#gH)" opacity="0.92"/>
          <path d="
            M 118,170 C 98,148 72,118 50,78
            C 55,92 66,118 78,140 C 88,158 106,166 114,170 Z"
            fill="url(#gH)" opacity="0.88"/>
          <path d="
            M 110,178 C 84,158 52,128 20,92
            C 28,107 46,132 65,152 C 78,166 98,175 106,178 Z"
            fill="url(#gH)" opacity="0.82"/>
          <path d="
            M 104,186 C 74,168 40,142 8,110
            C 18,126 44,152 68,170 C 82,180 98,185 100,186 Z"
            fill="url(#gH)" opacity="0.74"/>
          <path d="
            M 100,194 C 68,180 34,160 4,132
            C 15,148 46,170 74,184 C 86,190 96,194 98,194 Z"
            fill="url(#gH)" opacity="0.62"/>
          <path d="
            M 100,202 C 70,194 36,178 10,155
            C 20,170 52,188 78,198 C 88,202 96,202 98,202 Z"
            fill="url(#gH)" opacity="0.48"/>
        </g>

        {/* ═══════════════ CORPS DU PHÉNIX (derrière le cercle) ═══════════════ */}
        <ellipse cx="150" cy="196" rx="28" ry="42" fill="url(#gV)" opacity="0.18"/>

        {/* ═══════════════ CERCLE RR ═══════════════ */}
        <circle cx="150" cy="196" r="70" fill="none" stroke="url(#gV)" strokeWidth="0.7" opacity="0.3"/>
        <circle cx="150" cy="196" r="64" fill="none" stroke="url(#gV)" strokeWidth="3.2"/>
        <circle cx="150" cy="196" r="59" fill="#04070D"/>
        <circle cx="150" cy="196" r="56" fill="none" stroke="url(#gV)" strokeWidth="1.1"/>

        {/* ═══════════════ R + Я (pas de chevauchement) ═══════════════ */}
        <text x="120" y="222"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="48" fontWeight="700"
          fill="url(#gV)">R</text>
        {/* Я centré à x=180, transform=translate(360,0)scale(-1,1) */}
        <text x="180" y="222"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="48" fontWeight="700"
          fill="url(#gV)"
          transform="translate(360,0) scale(-1,1)">R</text>

        {/* ═══════════════ QUEUE — FLAMMES ET VOLUTES ═══════════════ */}
        {/* Flamme centrale */}
        <path d="M 150,262 C 146,278 138,294 140,312 C 144,296 148,280 150,262 Z" fill="url(#gFire)" opacity="0.9"/>
        <path d="M 150,262 C 154,278 162,294 160,312 C 156,296 152,280 150,262 Z" fill="url(#gFire)" opacity="0.9"/>
        {/* Volute gauche */}
        <path d="
          M 140,265 C 128,278 118,292 116,308
          C 116,294 120,278 126,264
          C 122,276 118,290 120,304
          C 122,290 128,276 136,265 Z"
          fill="url(#gFire)" opacity="0.8"/>
        {/* Volute droite */}
        <path d="
          M 160,265 C 172,278 182,292 184,308
          C 184,294 180,278 174,264
          C 178,276 182,290 180,304
          C 178,290 172,276 164,265 Z"
          fill="url(#gFire)" opacity="0.8"/>
        {/* Flamme ext gauche */}
        <path d="M 130,270 C 114,285 106,302 110,318 C 112,302 118,285 128,270 Z" fill="url(#gFire)" opacity="0.6"/>
        {/* Flamme ext droite */}
        <path d="M 170,270 C 186,285 194,302 190,318 C 188,302 182,285 172,270 Z" fill="url(#gFire)" opacity="0.6"/>
        {/* Spirale gauche (enroulement caractéristique du phénix) */}
        <path d="M 122,272 C 108,284 100,298 104,314 C 106,300 112,286 118,274 C 110,288 108,304 114,316 C 116,302 120,288 122,272 Z"
          fill="url(#gFire)" opacity="0.45"/>
        {/* Spirale droite */}
        <path d="M 178,272 C 192,284 200,298 196,314 C 194,300 188,286 182,274 C 190,288 192,304 186,316 C 184,302 180,288 178,272 Z"
          fill="url(#gFire)" opacity="0.45"/>

        {/* ═══════════════ PATTES / SERRES ═══════════════ */}
        {/* Tibia gauche */}
        <path d="M 128,298 C 120,306 116,314 118,322" stroke="url(#gV)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {/* Griffe G1 */}
        <path d="M 112,318 C 106,324 104,332 108,338" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Griffe G2 */}
        <path d="M 120,320 C 115,328 115,336 120,340" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Griffe G3 */}
        <path d="M 128,320 C 125,328 126,336 132,340" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Pied gauche */}
        <path d="M 108,318 C 112,314 126,314 130,318" stroke="url(#gV)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* Tibia droit */}
        <path d="M 172,298 C 180,306 184,314 182,322" stroke="url(#gV)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {/* Griffe D1 */}
        <path d="M 188,318 C 194,324 196,332 192,338" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Griffe D2 */}
        <path d="M 180,320 C 185,328 185,336 180,340" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Griffe D3 */}
        <path d="M 172,320 C 175,328 174,336 168,340" stroke="url(#gV)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* Pied droit */}
        <path d="M 192,318 C 188,314 174,314 170,318" stroke="url(#gV)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* ═══════════════ GMAO ═══════════════ */}
        <path d="M 96,330 C 116,326 136,324 150,324 C 164,324 184,326 204,330"
          stroke="url(#gV)" strokeWidth="1" fill="none" opacity="0.6"/>
        <text x="150" y="342"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="16" fontWeight="700"
          fill="url(#gB)" letterSpacing="8">GMAO</text>
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

export function RRLogoBadge({ size = 70 }: { size?: number }) {
  return <RRLogo size={size} showText={false} />;
}
