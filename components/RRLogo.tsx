import React from 'react';

export default function RRLogo({ size = 200, showText = false }: { size?: number; showText?: boolean }) {
  const w = Math.round(size);
  const h = Math.round(size * 1.07); // viewBox 560×600

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={w} height={h} viewBox="0 0 560 600" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </defs>

        {/* ════════════════ AILE DROITE — 7 plumes rayonnant vers le haut ════════════════ */}
        {/* Plume R1 — quasi verticale */}
        <path d="M 289,172 C 285,126 283,76 285,30
                  C 288,76 291,126 293,172 Z" fill="url(#gH)"/>
        {/* Plume R2 */}
        <path d="M 300,168 C 304,121 318,72 340,36
                  C 333,76 319,123 305,168 Z" fill="url(#gH)"/>
        {/* Plume R3 */}
        <path d="M 316,164 C 328,117 358,69 397,42
                  C 381,73 351,120 321,164 Z" fill="url(#gH)"/>
        {/* Plume R4 */}
        <path d="M 333,160 C 356,113 397,69 445,52
                  C 426,74 387,117 338,160 Z" fill="url(#gH)"/>
        {/* Plume R5 */}
        <path d="M 352,158 C 385,113 435,73 490,63
                  C 469,82 422,120 357,158 Z" fill="url(#gH)"/>
        {/* Plume R6 */}
        <path d="M 370,159 C 412,121 468,87 528,83
                  C 505,100 452,132 376,163 Z" fill="url(#gH)"/>
        {/* Plume R7 — quasi horizontale */}
        <path d="M 387,166 C 433,137 491,115 548,119
                  C 523,134 468,153 391,170 Z" fill="url(#gH)" opacity="0.80"/>

        {/* ════════════════ AILE GAUCHE — miroir parfait ════════════════ */}
        <g transform="translate(560,0) scale(-1,1)">
          <path d="M 289,172 C 285,126 283,76 285,30
                    C 288,76 291,126 293,172 Z" fill="url(#gH)"/>
          <path d="M 300,168 C 304,121 318,72 340,36
                    C 333,76 319,123 305,168 Z" fill="url(#gH)"/>
          <path d="M 316,164 C 328,117 358,69 397,42
                    C 381,73 351,120 321,164 Z" fill="url(#gH)"/>
          <path d="M 333,160 C 356,113 397,69 445,52
                    C 426,74 387,117 338,160 Z" fill="url(#gH)"/>
          <path d="M 352,158 C 385,113 435,73 490,63
                    C 469,82 422,120 357,158 Z" fill="url(#gH)"/>
          <path d="M 370,159 C 412,121 468,87 528,83
                    C 505,100 452,132 376,163 Z" fill="url(#gH)"/>
          <path d="M 387,166 C 433,137 491,115 548,119
                    C 523,134 468,153 391,170 Z" fill="url(#gH)" opacity="0.80"/>
        </g>

        {/* ════════════════ TÊTE DU PHÉNIX ════════════════ */}
        {/* Cou */}
        <path d="M 270,184 C 267,170 268,158 274,152
                  C 278,148 282,148 286,152
                  C 292,158 293,170 290,184 Z"
          fill="url(#gV)" opacity="0.88"/>
        {/* Tête */}
        <ellipse cx="280" cy="144" rx="19" ry="23" fill="url(#gV)"/>
        {/* Bec */}
        <path d="M 291,132 L 306,122 L 295,134 Z" fill="url(#gV)"/>
        {/* Œil */}
        <circle cx="291" cy="139" r="3.8" fill="#04070D"/>
        <circle cx="292" cy="138" r="1.3" fill="url(#gV)"/>
        {/* Crête — plumes de tête */}
        <path d="M 278,122 C 272,106 270,88 274,72
                  C 276,88 278,106 280,122 Z" fill="url(#gV)" opacity="0.85"/>
        <path d="M 284,120 C 281,103 283,85 289,69
                  C 288,86 285,104 286,120 Z" fill="url(#gV)" opacity="0.72"/>
        <path d="M 272,125 C 264,108 261,89 265,73
                  C 267,89 270,108 274,125 Z" fill="url(#gV)" opacity="0.60"/>

        {/* ════════════════ COURONNE ════════════════ */}
        <path d="M 234,94 L 240,70 L 253,86 L 280,50 L 307,86 L 320,70 L 326,94 Z"
          fill="url(#gV)"/>
        <rect x="232" y="90" width="96" height="12" rx="2.5" fill="url(#gV)"/>
        <path d="M 238,90 Q 252,82 266,90" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 268,90 Q 280,82 292,90" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 294,90 Q 308,82 322,90" fill="none" stroke="url(#gV)" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="240" cy="69" r="5"  fill="url(#gV)"/>
        <circle cx="280" cy="48" r="6"  fill="url(#gV)"/>
        <circle cx="320" cy="69" r="5"  fill="url(#gV)"/>

        {/* ════════════════ CORPS (silhouette derrière cercle) ════════════════ */}
        <ellipse cx="280" cy="272" rx="36" ry="88" fill="url(#gV)" opacity="0.13"/>

        {/* ════════════════ VOLUTES BAROQUES — spirales du bas ════════════════ */}
        {/* Spirale droite — 3 courbes imbriquées formant un enroulement */}
        <path d="
          M 318,358
          C 368,360 430,380 468,422
          C 500,456 498,500 468,520
          C 440,538 400,532 374,508
          C 346,482 338,444 350,416
          C 360,392 385,378 408,382
          C 430,386 446,407 442,428
          C 438,448 422,459 406,453
          C 388,445 382,427 388,413
          C 394,399 410,397 418,409
        " stroke="url(#gH)" strokeWidth="20" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>

        <path d="
          M 324,376
          C 367,378 422,398 452,432
          C 476,460 472,494 447,510
          C 422,524 388,516 366,494
          C 342,470 338,434 352,408
          C 364,386 388,376 408,382
          C 426,388 438,408 432,428
          C 426,446 412,456 398,450
          C 382,442 378,424 386,410
        " stroke="url(#gH)" strokeWidth="11" fill="none"
          strokeLinecap="round" opacity="0.62"/>

        <path d="
          M 334,396
          C 364,398 402,414 422,440
          C 438,460 432,484 410,494
          C 388,504 360,494 348,472
          C 336,450 338,420 354,404
          C 366,391 384,388 400,396
          C 414,404 420,422 412,436
          C 404,448 388,452 376,442
          C 364,432 364,414 376,406
        " stroke="url(#gH)" strokeWidth="6" fill="none"
          strokeLinecap="round" opacity="0.44"/>

        {/* Spirale gauche — miroir */}
        <g transform="translate(560,0) scale(-1,1)">
          <path d="
            M 318,358
            C 368,360 430,380 468,422
            C 500,456 498,500 468,520
            C 440,538 400,532 374,508
            C 346,482 338,444 350,416
            C 360,392 385,378 408,382
            C 430,386 446,407 442,428
            C 438,448 422,459 406,453
            C 388,445 382,427 388,413
            C 394,399 410,397 418,409
          " stroke="url(#gH)" strokeWidth="20" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>

          <path d="
            M 324,376
            C 367,378 422,398 452,432
            C 476,460 472,494 447,510
            C 422,524 388,516 366,494
            C 342,470 338,434 352,408
            C 364,386 388,376 408,382
            C 426,388 438,408 432,428
            C 426,446 412,456 398,450
            C 382,442 378,424 386,410
          " stroke="url(#gH)" strokeWidth="11" fill="none"
            strokeLinecap="round" opacity="0.62"/>

          <path d="
            M 334,396
            C 364,398 402,414 422,440
            C 438,460 432,484 410,494
            C 388,504 360,494 348,472
            C 336,450 338,420 354,404
            C 366,391 384,388 400,396
            C 414,404 420,422 412,436
            C 404,448 388,452 376,442
            C 364,432 364,414 376,406
          " stroke="url(#gH)" strokeWidth="6" fill="none"
            strokeLinecap="round" opacity="0.44"/>
        </g>

        {/* Plumes de queue centrales reliant corps aux spirales */}
        <path d="M 280,350 C 277,374 275,402 277,426 C 280,402 283,374 283,350 Z" fill="url(#gV)" opacity="0.72"/>
        <path d="M 273,352 C 267,378 263,406 263,430 C 267,406 271,379 275,352 Z" fill="url(#gV)" opacity="0.54"/>
        <path d="M 287,352 C 293,378 297,406 297,430 C 293,406 289,379 285,352 Z" fill="url(#gV)" opacity="0.54"/>
        <path d="M 265,355 C 255,382 251,411 253,436 C 257,412 261,384 267,355 Z" fill="url(#gV)" opacity="0.36"/>
        <path d="M 295,355 C 305,382 309,411 307,436 C 303,412 299,384 293,355 Z" fill="url(#gV)" opacity="0.36"/>

        {/* ════════════════ CERCLE RR ════════════════ */}
        <circle cx="280" cy="272" r="88" fill="none" stroke="url(#gV)" strokeWidth="0.7" opacity="0.3"/>
        <circle cx="280" cy="272" r="80" fill="none" stroke="url(#gV)" strokeWidth="3.4"/>
        <circle cx="280" cy="272" r="74" fill="#04070D"/>
        <circle cx="280" cy="272" r="71" fill="none" stroke="url(#gV)" strokeWidth="1.1"/>

        {/* ════════════════ R + Я ════════════════ */}
        <text x="245" y="302"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="58" fontWeight="700"
          fill="url(#gV)">R</text>
        {/* Я : centré à x=315, transform=translate(630,0) scale(-1,1) */}
        <text x="315" y="302"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="58" fontWeight="700"
          fill="url(#gV)"
          transform="translate(630,0) scale(-1,1)">R</text>

        {/* ════════════════ GMAO ════════════════ */}
        <path d="M 188,558 C 222,553 252,551 280,551 C 308,551 338,553 372,558"
          stroke="url(#gV)" strokeWidth="1" fill="none" opacity="0.5"/>
        <text x="280" y="576"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="19" fontWeight="700"
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
