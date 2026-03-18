import React from 'react';

/**
 * Logo RR GMAO — inspiré du monogramme Rolls-Royce
 * Deux R entrelacés dans un badge rectangulaire avec finitions dorées
 */
export default function RRLogo({ size = 44, showText = true }: { size?: number; showText?: boolean }) {
  const badgeW = Math.round(size * 1.1);
  const badgeH = Math.round(size * 0.72);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Badge RR */}
      <svg width={badgeW} height={badgeH} viewBox="0 0 55 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bordure extérieure dorée */}
        <rect x="0.5" y="0.5" width="54" height="35" rx="4" fill="#0d1117" stroke="#c9a236" strokeWidth="1.2"/>
        {/* Ligne fine intérieure */}
        <rect x="2.5" y="2.5" width="50" height="31" rx="2.5" fill="none" stroke="#c9a23640" strokeWidth="0.5"/>

        {/* R gauche */}
        <g fill="#c9a236">
          {/* Fût vertical */}
          <rect x="8" y="8" width="3.5" height="20" rx="0.5"/>
          {/* Arche du haut (bowl) */}
          <path d="M11.5 8 Q22 8 22 13.5 Q22 19 11.5 19 L11.5 16.5 Q19 16.5 19 13.5 Q19 10.5 11.5 10.5 Z"/>
          {/* Patte diagonale */}
          <path d="M13 19 L22 28 L19 28 L10.5 19.5 Z"/>
        </g>

        {/* R droite — légèrement décalée pour l'entrelacement */}
        <g fill="#c9a236" opacity="0.92">
          {/* Fût vertical */}
          <rect x="23" y="8" width="3.5" height="20" rx="0.5"/>
          {/* Arche du haut (bowl) */}
          <path d="M26.5 8 Q37 8 37 13.5 Q37 19 26.5 19 L26.5 16.5 Q34 16.5 34 13.5 Q34 10.5 26.5 10.5 Z"/>
          {/* Patte diagonale */}
          <path d="M28 19 L37 28 L34 28 L25.5 19.5 Z"/>
        </g>

        {/* GMAO en bas à droite */}
        <text x="40" y="30" fontFamily="Georgia, serif" fontSize="7.5" fontWeight="700" fill="#c9a23699" letterSpacing="0.5" textAnchor="middle">GMAO</text>
      </svg>

      {/* Texte RR GMAO à droite du badge */}
      {showText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#c9a236', letterSpacing: '0.5px', fontFamily: 'Georgia, serif' }}>RR GMAO</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Espace Manager</span>
        </span>
      )}
    </span>
  );
}

/** Version compacte pour les sidebars sans le texte latéral */
export function RRLogoBadge({ size = 36 }: { size?: number }) {
  return <RRLogo size={size} showText={false} />;
}
