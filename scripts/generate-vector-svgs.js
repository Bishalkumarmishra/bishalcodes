const fs = require('fs');
const path = require('path');

const rootDir = 'g:/bishal';

// ══════════════════════════════════════════════════════════════════════════════
// 1. PURE VECTOR 3D CALENDAR APP ICON (calendar-desktop-icon.svg & mero-patro-app-icon-3d.svg)
// ══════════════════════════════════════════════════════════════════════════════
const svg3DVector = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Squircle Gradient -->
    <linearGradient id="bgGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#ff3333"/>
      <stop offset="25%" stop-color="#ea1d24"/>
      <stop offset="70%" stop-color="#b80c10"/>
      <stop offset="100%" stop-color="#7a0508"/>
    </linearGradient>

    <!-- Subtle Top Rim Light on Squircle -->
    <linearGradient id="rimLight" x1="0.5" y1="0" x2="0.5" y2="0.4">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Calendar Drop Shadow -->
    <filter id="padShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="28" stdDeviation="22" flood-color="#3d0305" flood-opacity="0.65"/>
    </filter>

    <!-- Header Drop Shadow onto White Page -->
    <filter id="headerShadow" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.18"/>
    </filter>

    <!-- Ring Binder Shadow -->
    <filter id="ringShadow" x="-40%" y="-30%" width="180%" height="180%">
      <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>

    <!-- Text Drop Shadow -->
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#300204" flood-opacity="0.6"/>
    </filter>

    <!-- Calendar Red Header Gradient -->
    <linearGradient id="calHeaderGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#ff3838"/>
      <stop offset="60%" stop-color="#e2181e"/>
      <stop offset="100%" stop-color="#be0d12"/>
    </linearGradient>

    <!-- Binder Ring 3D Metallic Gloss Gradient -->
    <linearGradient id="ringGloss" x1="0" y1="0.5" x2="1" y2="0.5">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#e6eaf0"/>
      <stop offset="85%" stop-color="#c2c7d2"/>
      <stop offset="100%" stop-color="#9ea5b3"/>
    </linearGradient>

    <!-- Mountain Deep Blue Gradient -->
    <linearGradient id="mountainGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#1b5299"/>
      <stop offset="40%" stop-color="#123e7a"/>
      <stop offset="100%" stop-color="#0b2447"/>
    </linearGradient>

    <!-- Pagoda Temple Red Shading -->
    <linearGradient id="templeRoofGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#ff3b3b"/>
      <stop offset="65%" stop-color="#d6141a"/>
      <stop offset="100%" stop-color="#9e0c10"/>
    </linearGradient>

    <!-- Curled Paper Shadow -->
    <filter id="curlShadowFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="-10" dy="-10" stdDeviation="12" flood-color="#000000" flood-opacity="0.32"/>
    </filter>

    <!-- Curled Paper Gradient -->
    <linearGradient id="curlPaperGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#f0f3f8"/>
      <stop offset="75%" stop-color="#d9dee7"/>
      <stop offset="100%" stop-color="#b6becb"/>
    </linearGradient>

    <!-- Clip Path for Inside Calendar Page -->
    <clipPath id="calendarPageClip">
      <rect x="220" y="270" width="584" height="420" rx="0"/>
    </clipPath>
  </defs>

  <!-- 1. Background Squircle with 3D Depth -->
  <rect x="48" y="48" width="928" height="928" rx="210" fill="url(#bgGrad)" />
  <rect x="52" y="52" width="920" height="920" rx="206" fill="url(#rimLight)" />

  <!-- 2. Main Desk Calendar Pad (Group with Drop Shadow) -->
  <g filter="url(#padShadow)">
    <!-- Base White Calendar Body -->
    <rect x="220" y="155" width="584" height="535" rx="54" fill="#ffffff"/>

    <!-- Calendar Red Header Strip -->
    <path d="M 220,209 Q 220,155 274,155 L 750,155 Q 804,155 804,209 L 804,285 L 220,285 Z" fill="url(#calHeaderGrad)" filter="url(#headerShadow)"/>

    <!-- Punch Holes for Rings (Left & Right) -->
    <!-- Left Hole -->
    <rect x="322" y="185" width="68" height="68" rx="34" fill="#6d0508"/>
    <rect x="325" y="188" width="62" height="62" rx="31" fill="#400204"/>

    <!-- Right Hole -->
    <rect x="634" y="185" width="68" height="68" rx="34" fill="#6d0508"/>
    <rect x="637" y="188" width="62" height="62" rx="31" fill="#400204"/>

    <!-- ════════════ CALENDAR CONTENT (HIMALAYAS, TEMPLE, NEPAL FLAG) ════════════ -->
    <g clip-path="url(#calendarPageClip)">
      
      <!-- NEPAL SUN & MOON (Top Right of Page) -->
      <g transform="translate(625, 305) scale(0.95)">
        <!-- Crescent Moon with Sun (Nepal Flag Emblem) -->
        <path d="M 40,24 C 40,38 28,50 14,50 C 7,50 0,46 -4,40 C 2,41 12,39 18,33 C 25,26 26,14 20,4 C 33,7 40,15 40,24 Z" fill="#e51c24" transform="rotate(-25 18 25) scale(1.3)"/>
        <path d="M 15,10 L 19,16 L 26,13 L 26,20 L 33,21 L 29,27 L 34,31 L 28,34 L 30,41 L 23,39 L 21,46 L 17,40 L 12,44 L 12,37 L 5,37 L 9,31 L 4,27 L 10,24 L 7,17 L 14,19 Z" fill="#e51c24" transform="translate(18, 48) scale(0.9)"/>
      </g>

      <!-- PAGODA TEMPLE (Center Landmark) -->
      <g transform="translate(512, 290)">
        <!-- Gajur (Golden/Red Pinnacle) -->
        <path d="M 0,-18 L 4,-8 L 2,-8 L 5,0 L -5,0 L -2,-8 L -4,-8 Z" fill="#d6141a"/>
        <circle cx="0" cy="-20" r="3.5" fill="#e51c24"/>

        <!-- Top Small Roof -->
        <path d="M 0,-6 L 36,12 L -36,12 Z" fill="url(#templeRoofGrad)"/>
        <path d="M -38,12 Q 0,8 38,12 L 32,18 Q 0,14 -32,18 Z" fill="#9e0c10"/>

        <!-- Middle Tier Roof -->
        <path d="M -18,18 L 18,18 L 28,34 L -28,34 Z" fill="#c01116"/>
        <path d="M 0,32 L 68,54 L -68,54 Z" fill="url(#templeRoofGrad)"/>
        <path d="M -70,54 Q 0,48 70,54 L 62,62 Q 0,56 -62,62 Z" fill="#9e0c10"/>

        <!-- Lower Main Roof (Widest Pagoda Eaves) -->
        <path d="M -35,62 L 35,62 L 48,82 L -48,82 Z" fill="#c01116"/>
        <path d="M 0,80 L 138,114 L -138,114 Z" fill="url(#templeRoofGrad)"/>
        <path d="M -142,114 Q 0,104 142,114 L 130,126 Q 0,116 -130,126 Z" fill="#88090d"/>

        <!-- Temple Base / Walls & Pillars -->
        <rect x="-70" y="126" width="140" height="62" fill="#c01116"/>
        <!-- White Windows / Intricate Doors -->
        <rect x="-50" y="138" width="22" height="34" rx="4" fill="#ffffff"/>
        <rect x="-11" y="138" width="22" height="50" rx="5" fill="#ffffff"/>
        <rect x="28" y="138" width="22" height="34" rx="4" fill="#ffffff"/>

        <!-- Multi-tier Plinth Base -->
        <rect x="-90" y="188" width="180" height="14" fill="#88090d"/>
        <rect x="-105" y="202" width="210" height="16" fill="#6d0508"/>
      </g>

      <!-- HIMALAYAN MOUNTAINS (Deep Blue Peaks with Pure White Snow) -->
      <!-- Left High Mountain Peak -->
      <polygon points="220,620 220,530 365,370 515,530 515,620" fill="url(#mountainGrad)"/>
      <!-- Left Snow Ridge -->
      <polygon points="365,370 330,420 350,430 320,470 365,450 395,480 380,430 420,440" fill="#ffffff"/>
      <polygon points="365,370 350,430 365,450 380,430" fill="#e8effa"/>

      <!-- Center & Right Himalayas Peak -->
      <polygon points="340,620 495,405 660,620" fill="url(#mountainGrad)"/>
      <!-- Center Snow Peak -->
      <polygon points="495,405 455,465 480,475 450,515 495,490 535,525 520,470 560,480" fill="#ffffff"/>

      <!-- Right Foreground Mountain -->
      <polygon points="500,620 620,440 804,580 804,620" fill="url(#mountainGrad)"/>
      <polygon points="620,440 585,495 605,505 580,545 620,520 655,550 645,500 680,510" fill="#ffffff"/>

      <!-- Bottom Solid Mountain Base filling to page bottom -->
      <rect x="220" y="605" width="584" height="85" fill="#0b2447"/>
    </g>

    <!-- Curled Bottom-Right Page Corner -->
    <g filter="url(#curlShadowFilter)">
      <!-- Curled flap folding over -->
      <path d="M 685,690 C 720,675 750,645 804,560 L 804,636 Q 804,690 750,690 Z" fill="url(#curlPaperGrad)"/>
    </g>

    <!-- 3D Spiral Binder Rings (Front Loops with Drop Shadow) -->
    <!-- Left Loop -->
    <g filter="url(#ringShadow)">
      <rect x="334" y="122" width="44" height="128" rx="22" fill="url(#ringGloss)"/>
      <rect x="339" y="127" width="10" height="118" rx="5" fill="#ffffff" opacity="0.8"/>
    </g>

    <!-- Right Loop -->
    <g filter="url(#ringShadow)">
      <rect x="646" y="122" width="44" height="128" rx="22" fill="url(#ringGloss)"/>
      <rect x="651" y="127" width="10" height="118" rx="5" fill="#ffffff" opacity="0.8"/>
    </g>
  </g>

  <!-- 3. Bottom Bold White Typography "Mero Patro" -->
  <text 
    x="512" 
    y="842" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
    font-weight="900" 
    font-size="82" 
    fill="#ffffff" 
    text-anchor="middle" 
    letter-spacing="1.5"
    filter="url(#textGlow)"
  >
    Mero Patro
  </text>
</svg>`;

// ══════════════════════════════════════════════════════════════════════════════
// 2. PURE VECTOR 2D LOGO (mero-patro-logo.svg & hamro-patro-logo.svg)
// ══════════════════════════════════════════════════════════════════════════════
const svg2DVector = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="logoBg" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#ea1d24"/>
      <stop offset="100%" stop-color="#d6141a"/>
    </linearGradient>
  </defs>

  <!-- Red Squircle -->
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#logoBg)"/>

  <!-- Top Symbols: Sun (Left Oval) & Crescent Moon (Right) -->
  <!-- White Sun Emblem (Oval/Egg) -->
  <ellipse cx="212" cy="180" rx="24" ry="34" fill="#ffffff"/>

  <!-- White Crescent Moon Emblem (Curving to the right) -->
  <path d="M 330,126 C 362,126 394,148 402,185 C 405,198 402,216 391,232 C 376,252 352,264 324,264 C 360,248 375,214 366,178 C 360,154 344,136 330,126 Z" fill="#ffffff"/>

  <!-- Center-Stacked Devanagari Typography: मेरो (Top) & पात्रो (Bottom) -->
  <g fill="#ffffff" text-anchor="middle">
    <!-- Top Line: मेरो -->
    <text 
      x="256" 
      y="325" 
      font-family="'Noto Sans Devanagari', 'Mukta', 'Mangal', 'Segoe UI', system-ui, sans-serif" 
      font-size="68" 
      font-weight="900" 
      letter-spacing="2"
    >
      मेरो
    </text>

    <!-- Bottom Line: पात्रो -->
    <text 
      x="256" 
      y="405" 
      font-family="'Noto Sans Devanagari', 'Mukta', 'Mangal', 'Segoe UI', system-ui, sans-serif" 
      font-size="68" 
      font-weight="900" 
      letter-spacing="2"
    >
      पात्रो
    </text>
  </g>
</svg>`;

// Write pure vector files to public directory
fs.writeFileSync(path.join(rootDir, 'public', 'mero-patro-app-icon-3d.svg'), svg3DVector);
fs.writeFileSync(path.join(rootDir, 'public', 'calendar-desktop-icon.svg'), svg3DVector);
fs.writeFileSync(path.join(rootDir, 'public', 'mero-patro-logo.svg'), svg2DVector);
fs.writeFileSync(path.join(rootDir, 'public', 'hamro-patro-logo.svg'), svg2DVector);

console.log('✓ Pure high-definition Vector SVGs generated successfully without raster pixelation!');
