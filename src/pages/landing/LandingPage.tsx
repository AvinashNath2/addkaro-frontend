import { Link } from 'react-router-dom'
import { MapPin, Building2, Handshake, ArrowRight, Eye, MessageSquare, Printer, Wrench, Hammer, Megaphone } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Road geometry (narrower — fills gap between buildings and road):
//   Bottom: (475,480) → (725,480)   width 250 px
//   Top:    (584,222) → (616,222)   width  32 px  (ratio ≈ 0.128)
//   Centre line: x = 600 (straight vertical)
// ─────────────────────────────────────────────────────────────────────────────
function CityscapeSVG() {
  const stars: [number, number, number][] = [
    [60,30,1.5],[120,55,1],[200,20,1.5],[280,45,1],[350,25,1.5],[80,80,1],[160,70,1],
    [900,30,1.5],[980,50,1],[1050,20,1.5],[1120,45,1],[1150,70,1],[860,65,1],[1000,80,1],
    [440,40,1],[500,22,1.2],[320,65,1],[740,35,1.2],[820,55,1],[1060,55,1.2],[400,70,1],
  ]

  // Top-down car centered at (0,0) — orientation rotated so it aligns with
  // the road (long axis = Y, car travels along Y).
  // approaching  = headlights at cy=+26 (bottom = facing viewer)
  // receding     = headlights at cy=-26 (top = facing vanishing point)
  const ApproachCar = ({ fill }: { fill: string }) => (
    <g>
      <rect x="-11" y="-28" width="22" height="56" rx="7" fill={fill} />
      <rect x="-7"  y="-18" width="14" height="10" rx="2" fill="#1a3a6a" opacity="0.45" />
      {/* headlights — front = bottom for approaching car */}
      <ellipse cx="-6" cy="27"  rx="4" ry="3" fill="#fffde0" opacity="0.95" />
      <ellipse cx="6"  cy="27"  rx="4" ry="3" fill="#fffde0" opacity="0.95" />
      {/* taillights — rear = top */}
      <ellipse cx="-6" cy="-27" rx="4" ry="3" fill="#ff2200" opacity="0.8" />
      <ellipse cx="6"  cy="-27" rx="4" ry="3" fill="#ff2200" opacity="0.8" />
    </g>
  )

  const RecedeCar = ({ fill }: { fill: string }) => (
    <g>
      <rect x="-11" y="-28" width="22" height="56" rx="7" fill={fill} />
      <rect x="-7"  y="8"   width="14" height="10" rx="2" fill="#1a3a6a" opacity="0.45" />
      {/* headlights — front = top for receding car */}
      <ellipse cx="-6" cy="-27" rx="4" ry="3" fill="#fffde0" opacity="0.95" />
      <ellipse cx="6"  cy="-27" rx="4" ry="3" fill="#fffde0" opacity="0.95" />
      {/* taillights — rear = bottom */}
      <ellipse cx="-6" cy="27"  rx="4" ry="3" fill="#ff2200" opacity="0.8" />
      <ellipse cx="6"  cy="27"  rx="4" ry="3" fill="#ff2200" opacity="0.8" />
    </g>
  )

  return (
    <svg viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#07091a" />
          <stop offset="55%"  stopColor="#152240" />
          <stop offset="100%" stopColor="#243355" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#181714" />
          <stop offset="100%" stopColor="#2a2820" />
        </linearGradient>
        <linearGradient id="swalk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#302e28" />
          <stop offset="100%" stopColor="#3e3b34" />
        </linearGradient>
        <radialGradient id="bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="#C9F31D" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#C9F31D" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Clip cars to the road trapezoid */}
        <clipPath id="rc">
          <polygon points="475,480 725,480 616,222 584,222" />
        </clipPath>
      </defs>

      {/* ── CSS animations ─────────────────────────────────────────────── */}
      <style>{`
        /* Left-lane cars APPROACH viewer: far (small) → near (large).
           Centre of L-lane: y=222→x=592, y=480→x=537                   */
        @keyframes app {
          0%  { transform: translate(592px,222px) scale(.13); opacity:0  }
          8%  { opacity:.9 }
          88% { opacity:.9 }
          100%{ transform: translate(537px,475px) scale(1);   opacity:0  }
        }
        /* Right-lane cars RECEDE from viewer: near (large) → far (small).
           Centre of R-lane: y=480→x=663, y=222→x=608                   */
        @keyframes rec {
          0%  { transform: translate(663px,475px) scale(1);   opacity:0  }
          8%  { opacity:.9 }
          88% { opacity:.9 }
          100%{ transform: translate(608px,222px) scale(.13); opacity:0  }
        }
        /* 3 cars approaching, negative delays spread them along the road */
        .a1 { animation: app 4.6s linear 0s    infinite }
        .a2 { animation: app 4.6s linear -1.53s infinite }
        .a3 { animation: app 4.6s linear -3.07s infinite }
        /* 2 cars receding */
        .r1 { animation: rec 4.6s linear -0.77s infinite }
        .r2 { animation: rec 4.6s linear -2.3s  infinite }

        /* Spotlight flicker */
        .spl { animation: spl 3.2s ease-in-out infinite }
        .spr { animation: spr 3.2s ease-in-out 1.3s infinite }
        @keyframes spl { 0%,100%{opacity:.13} 50%{opacity:.04} }
        @keyframes spr { 0%,100%{opacity:.07} 50%{opacity:.17} }

        /* Street-lamp pulse */
        .lg { animation: lg 4s ease-in-out infinite }
        @keyframes lg { 0%,100%{opacity:.9} 50%{opacity:.5} }

        /* Worker 1 bob */
        .w1g { animation: w1b 1.3s ease-in-out infinite }
        @keyframes w1b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        /* Worker 2 bob */
        .w2g { animation: w2b 1.7s ease-in-out .45s infinite }
        @keyframes w2b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        /* Worker 1 arm swing */
        .waa { transform-box:fill-box; transform-origin:100% 50%;
               animation: waa .8s ease-in-out infinite }
        @keyframes waa { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-30deg)} }
        /* Worker 2 arm swing */
        .wba { transform-box:fill-box; transform-origin:50% 0%;
               animation: wba .95s ease-in-out .25s infinite }
        @keyframes wba { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(28deg)} }

        /* Traffic light */
        .tl-r { animation: tlr 6s linear infinite }
        .tl-y { animation: tly 6s linear infinite }
        .tl-g { animation: tlg 6s linear infinite }
        @keyframes tlr { 0%,33%{fill:#ff2211} 34%,100%{fill:#330500} }
        @keyframes tly { 0%,33%{fill:#1a0800} 34%,66%{fill:#ffaa00} 67%,100%{fill:#1a0800} }
        @keyframes tlg { 0%,66%{fill:#001800} 67%,100%{fill:#22cc44} }

        /* Scaffold warning blink */
        .wbl { animation: wblf 1.1s ease-in-out infinite }
        @keyframes wblf { 0%,100%{opacity:.9} 50%{opacity:.1} }
      `}</style>

      {/* ── Sky ──────────────────────────────────────────────────────────── */}
      <rect width="1200" height="500" fill="url(#sky)" />

      {stars.map(([x,y,r],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.3+(i%5)*0.1} />
      ))}

      {/* Moon */}
      <circle cx="1080" cy="52" r="22" fill="#fffbe8" opacity="0.88" />
      <circle cx="1093" cy="46" r="18" fill="#152240" opacity="0.85" />

      {/* Horizon glow */}
      <ellipse cx="600" cy="222" rx="270" ry="26" fill="#ff9a3c" opacity="0.07" />

      {/* ── Far/horizon building silhouettes ────────────────────────────── */}
      {([
        [395,172,42,50],[432,155,28,67],[456,166,38,56],[490,148,34,74],
        [521,160,46,62],[565,145,36,77],[600,154,52,68],[649,142,40,80],
        [687,158,34,64],[718,148,40,74],[756,162,48,60],[802,147,37,75],
        [836,160,43,62],[876,150,36,72],[912,144,54,78],
      ] as [number,number,number,number][]).map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#182035" />
      ))}

      {/* ── Left near buildings (right edge ≈ x 480, flush with road) ──── */}
      <rect x="-10" y="20"  width="105" height="460" fill="#0d0c0b" />
      <rect x="90"  y="55"  width="85"  height="425" fill="#111010" />
      <rect x="170" y="15"  width="125" height="465" fill="#0b0a09" />
      <rect x="290" y="50"  width="95"  height="430" fill="#100f0e" />
      {/* Extended to x=480 — right edge sits at the sidewalk/road boundary */}
      <rect x="380" y="88"  width="100" height="392" fill="#0e0d0c" />

      {/* Windows — left block */}
      {([
        [12,50],[32,50],[52,50],[12,76],[52,76],[32,76],[12,102],[32,102],
        [52,102],[12,128],[52,128],[12,154],[32,154],[12,180],[32,180],[52,180],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={9} height={13}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a6fa5'} opacity={0.6+(i%4)*0.1} />
      ))}
      {([
        [100,85],[118,85],[136,85],[154,85],[100,111],[136,111],
        [100,137],[118,137],[154,137],[100,163],[118,163],[136,163],[100,189],[154,189],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a7ab5'} opacity={0.55+(i%3)*0.12} />
      ))}
      {([
        [180,45],[200,45],[222,45],[244,45],[266,45],
        [180,73],[200,73],[244,73],[266,73],
        [180,101],[222,101],[244,101],[266,101],
        [180,129],[200,129],[222,129],[266,129],[180,157],[200,157],[244,157],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={12} height={16}
          fill={i%4===0?'#C9F31D':i%4===1?'#fff':i%4===2?'#4a7ab5':'#fff'}
          opacity={0.5+(i%5)*0.1} />
      ))}
      {([
        [300,78],[320,78],[342,78],[362,78],[300,106],[342,106],[362,106],
        [300,134],[320,134],[362,134],[300,162],[320,162],[342,162],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%3===0?'#C9F31D':'#fff'} opacity={0.5+(i%4)*0.1} />
      ))}
      {/* Windows on the extended building (x 380-480) */}
      {([
        [390,108],[410,108],[430,108],[450,108],
        [390,136],[430,136],[450,136],
        [390,164],[410,164],[450,164],
        [390,192],[410,192],[430,192],
        [390,220],[450,220],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a7ab5'} opacity={0.5+(i%4)*0.1} />
      ))}

      {/* ── Right near buildings (left edge ≈ x 718, flush with road) ──── */}
      {/* Two new buildings added to close the gap on the right */}
      <rect x="718"  y="65"  width="58"  height="415" fill="#111010" />
      <rect x="772"  y="45"  width="78"  height="435" fill="#0e0d0c" />
      <rect x="845"  y="80"  width="80"  height="400" fill="#100f0e" />
      <rect x="920"  y="40"  width="95"  height="440" fill="#0b0a09" />
      <rect x="1010" y="60"  width="100" height="420" fill="#111010" />
      <rect x="1105" y="25"  width="115" height="455" fill="#0d0c0b" />

      {/* Windows — right block (new buildings) */}
      {([
        [724,90],[738,90],[752,90],[724,118],[752,118],
        [724,146],[738,146],[752,146],[724,174],[738,174],
        [724,202],[752,202],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a7ab5'} opacity={0.5+(i%4)*0.1} />
      ))}
      {([
        [782,70],[800,70],[820,70],[840,70],
        [782,98],[820,98],[840,98],
        [782,126],[800,126],[840,126],
        [782,154],[800,154],[820,154],[782,182],[840,182],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={11} height={15}
          fill={i%3===0?'#C9F31D':'#fff'} opacity={0.5+(i%4)*0.1} />
      ))}
      {([
        [855,100],[873,100],[891,100],[855,128],[891,128],
        [855,156],[873,156],[855,184],[873,184],[891,184],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%2===0?'#C9F31D':'#fff'} opacity={0.5+(i%4)*0.12} />
      ))}
      {([
        [930,65],[952,65],[974,65],[930,93],[974,93],
        [930,121],[952,121],[974,121],[930,149],[952,149],[930,177],[974,177],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={11} height={15}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a7ab5'} opacity={0.55+(i%3)*0.12} />
      ))}
      {([
        [1020,85],[1042,85],[1064,85],[1086,85],
        [1020,113],[1064,113],[1086,113],
        [1020,141],[1042,141],[1086,141],
        [1020,169],[1042,169],[1064,169],[1020,197],[1086,197],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={11} height={15}
          fill={i%3===0?'#C9F31D':'#fff'} opacity={0.5+(i%4)*0.1} />
      ))}
      {([
        [1115,55],[1137,55],[1159,55],[1115,83],[1159,83],[1137,83],
        [1115,111],[1137,111],[1159,111],[1115,139],[1159,139],
        [1115,167],[1137,167],[1115,195],[1137,195],[1159,195],
      ] as [number,number][]).map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={10} height={14}
          fill={i%3===0?'#C9F31D':i%3===1?'#fff':'#4a7ab5'} opacity={0.55+(i%4)*0.1} />
      ))}

      {/* ── Traffic light (left sidewalk) ────────────────────────────────── */}
      <rect x="462" y="295" width="4" height="95" fill="#1e1d1b" />
      <rect x="452" y="255" width="24" height="50" rx="4" fill="#181816" />
      <circle cx="464" cy="267" r="7" className="tl-r" />
      <circle cx="464" cy="280" r="7" className="tl-y" />
      <circle cx="464" cy="293" r="7" className="tl-g" />

      {/* ── Ground / road ─────────────────────────────────────────────────── */}
      {/* Left sidewalk */}
      <polygon points="0,480 475,480 584,222 440,222"  fill="url(#swalk)" />
      {/* Right sidewalk */}
      <polygon points="725,480 1200,480 760,222 616,222" fill="url(#swalk)" />
      {/* Road surface */}
      <polygon points="475,480 725,480 616,222 584,222" fill="url(#road)" />
      {/* Kerb lines */}
      <line x1="475" y1="480" x2="584" y2="222" stroke="#666" strokeWidth="2" opacity="0.6" />
      <line x1="725" y1="480" x2="616" y2="222" stroke="#666" strokeWidth="2" opacity="0.6" />
      {/* Centre lane dashes — straight vertical at x=600 */}
      <line x1="600" y1="480" x2="600" y2="222" stroke="white" strokeWidth="2.5"
        strokeDasharray="24,20" opacity="0.45" />
      {/* Pavement texture lines on sidewalks */}
      <line x1="0"   y1="400" x2="475" y2="400" stroke="#444" strokeWidth="0.5" opacity="0.3" />
      <line x1="725" y1="400" x2="1200" y2="400" stroke="#444" strokeWidth="0.5" opacity="0.3" />
      <line x1="0"   y1="450" x2="475" y2="450" stroke="#444" strokeWidth="0.5" opacity="0.3" />
      <line x1="725" y1="450" x2="1200" y2="450" stroke="#444" strokeWidth="0.5" opacity="0.3" />

      {/* ── Street lamps ──────────────────────────────────────────────────── */}
      {/* Left lamp — pole base at x=458, arm points right toward road */}
      <rect x="456" y="295" width="6" height="185" fill="#252320" />
      <rect x="456" y="294" width="36" height="6" rx="3" fill="#252320" />
      <ellipse cx="490" cy="291" rx="7"  ry="7"  fill="#ffe566" className="lg" filter="url(#glow)" />
      <ellipse cx="490" cy="291" rx="16" ry="9"  fill="#ffe566" opacity="0.12" className="lg" />

      {/* Right lamp — pole base at x=740, arm points left toward road */}
      <rect x="738" y="295" width="6" height="185" fill="#252320" />
      <rect x="708" y="294" width="36" height="6" rx="3" fill="#252320" />
      <ellipse cx="710" cy="291" rx="7"  ry="7"  fill="#ffe566" className="lg" filter="url(#glow)" />
      <ellipse cx="710" cy="291" rx="16" ry="9"  fill="#ffe566" opacity="0.12" className="lg" />

      {/* ── Animated cars — clipped to road, perspective scale+translate ── */}
      <g clipPath="url(#rc)">
        {/* Left lane — approaching viewer (small→large, far→near) */}
        <g className="a1"><ApproachCar fill="#1a3060" /></g>
        <g className="a2"><ApproachCar fill="#8a1a1a" /></g>
        <g className="a3"><ApproachCar fill="#1a5020" /></g>
        {/* Right lane — receding from viewer (large→small, near→far) */}
        <g className="r1"><RecedeCar fill="#464a55" /></g>
        <g className="r2"><RecedeCar fill="#b83e18" /></g>
      </g>

      {/* ── Billboard glow halo ────────────────────────────────────────────── */}
      <ellipse cx="468" cy="158" rx="210" ry="85" fill="url(#bg)" />

      {/* Spotlight cones */}
      <polygon className="spl" points="288,84 215,188 262,188" fill="#C9F31D" />
      <polygon className="spr" points="672,84 746,188 698,188" fill="#C9F31D" />

      {/* ── Billboard structure ────────────────────────────────────────────── */}
      {/* Support pole */}
      <rect x="455" y="210" width="22" height="270" rx="2" fill="#171615" />
      {/* Diagonal braces */}
      <line x1="466" y1="312" x2="415" y2="368" stroke="#171615" strokeWidth="10" strokeLinecap="round" />
      <line x1="466" y1="344" x2="506" y2="378" stroke="#171615" strokeWidth="8"  strokeLinecap="round" />
      {/* Outer metal frame */}
      <rect x="280" y="82"  width="400" height="168" rx="3" fill="#090909" />
      {/* Face */}
      <rect x="286" y="88"  width="388" height="156" fill="#1a3560" />

      {/* ── Billboard content — all contained within x 286–674, y 88–244 ── */}
      {/* Top accent bar (y 88–116) */}
      <rect x="286" y="88" width="388" height="28" fill="#C9F31D" />
      <text x="480" y="107"
        textAnchor="middle" fill="#0a0a0a"
        fontSize="13" fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="3">
        OUTDOOR ADVERTISING
      </text>

      {/* Brand name — scaled to fit (286+16 padding each side = max width 356) */}
      <text x="480" y="172"
        textAnchor="middle" fill="#ffffff"
        fontSize="58" fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="-1">
        ADDKARO
      </text>

      {/* Tagline line 1 */}
      <text x="480" y="196"
        textAnchor="middle" fill="#C9F31D"
        fontSize="13" fontWeight="700"
        fontFamily="Arial, sans-serif" letterSpacing="2">
        INDIA'S HOARDING AGGREGATOR
      </text>

      {/* Tagline line 2 — services, smaller */}
      <text x="480" y="214"
        textAnchor="middle" fill="#8ab0d0"
        fontSize="10" fontWeight="600"
        fontFamily="Arial, sans-serif" letterSpacing="1.5">
        PRINT · INSTALL · MAINTAIN
      </text>

      {/* Face border glow */}
      <rect x="286" y="88" width="388" height="156" fill="none"
        stroke="#C9F31D" strokeWidth="1.5" opacity="0.3" />

      {/* Spotlight fixtures */}
      <rect x="290" y="76" width="12" height="16" rx="2" fill="#222" />
      <rect x="658" y="76" width="12" height="16" rx="2" fill="#222" />

      {/* ── Scaffold (right side of billboard) ──────────────────────────── */}
      <rect x="676" y="132" width="5" height="148" fill="#252220" />
      <rect x="722" y="132" width="5" height="148" fill="#252220" />
      <rect x="672" y="196" width="60" height="5" fill="#382e22" />
      <rect x="672" y="248" width="60" height="5" fill="#382e22" />
      <line x1="681" y1="196" x2="726" y2="248" stroke="#252220" strokeWidth="2" opacity="0.65" />
      <circle cx="680" cy="136" r="4" fill="#ff6600" className="wbl" />

      {/* ── Worker 1 — top platform, drilling into billboard ──────────── */}
      <g className="w1g">
        <rect x="688" y="172" width="11" height="22" rx="2" fill="#cc5500" />
        <circle cx="693" cy="167" r="7" fill="#d4845a" />
        <path d="M685 167 Q693 158 701 167 Z" fill="#ffcc00" />
        <rect x="685" y="166" width="16" height="3" rx="1" fill="#ffcc00" />
        <g className="waa">
          <rect x="675" y="178" width="14" height="4" rx="2" fill="#cc5500" />
          <rect x="668" y="176" width="8" height="6" rx="1" fill="#777" />
          <rect x="665" y="178" width="4" height="2" rx="1" fill="#aaa" />
        </g>
        <rect x="699" y="178" width="4" height="12" rx="2" fill="#cc5500" />
        <rect x="689" y="193" width="5" height="8" rx="1" fill="#223" />
        <rect x="695" y="193" width="5" height="8" rx="1" fill="#223" />
      </g>

      {/* ── Worker 2 — same platform, hammering upward ────────────────── */}
      <g className="w2g">
        <rect x="708" y="172" width="11" height="22" rx="2" fill="#1a4a9a" />
        <circle cx="713" cy="167" r="7" fill="#d4845a" />
        <path d="M705 167 Q713 158 721 167 Z" fill="#ffcc00" />
        <rect x="705" y="166" width="16" height="3" rx="1" fill="#ffcc00" />
        <g className="wba">
          <rect x="716" y="174" width="4" height="16" rx="2" fill="#1a4a9a" />
          <ellipse cx="718" cy="190" rx="5" ry="3.5" fill="#777" />
          <rect x="715" y="190" width="6" height="3" rx="1" fill="#555" />
        </g>
        <rect x="703" y="178" width="5" height="10" rx="2" fill="#1a4a9a" />
        <rect x="709" y="193" width="5" height="8" rx="1" fill="#223" />
        <rect x="715" y="193" width="5" height="8" rx="1" fill="#223" />
      </g>

      {/* Ground shadow */}
      <ellipse cx="480" cy="478" rx="85" ry="7" fill="#000" opacity="0.28" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'HOARDING OWNERS', 'ADVERTISERS', 'PRINT SERVICES', 'INSTALLATION TEAMS',
  'MAINTENANCE', 'OOH AGGREGATOR', 'CONNECT WITH PROS', 'OUTDOOR ADVERTISING',
]

const WHO_WE_SERVE = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Hoarding Owners',
    desc: 'List your sites, manage availability, and connect directly with advertisers looking for your space.',
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: 'Advertisers & Brands',
    desc: 'Browse, shortlist, and make offers on the perfect billboard for your campaign — by city, size, traffic.',
  },
  {
    icon: <Printer className="w-6 h-6" />,
    title: 'Print Services',
    desc: 'Connect your print shop with hoarding owners who need quality printing for their sites.',
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: 'Installation Teams',
    desc: 'Get discovered for hoarding installation, mounting, and setup work across your region.',
  },
  {
    icon: <Hammer className="w-6 h-6" />,
    title: 'Maintenance Services',
    desc: 'Offer repair, upkeep, and servicing of hoarding infrastructure to owners on the platform.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f1eb' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-2xl font-black tracking-tight uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#111' }}>
          AddKaro
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2 text-sm font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#555' }}>
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2 text-sm font-bold text-white"
            style={{ background: '#1a3560' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden py-3" style={{ background: '#0f0f13' }}>
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i}
              className="flex items-center gap-6 px-6 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
              style={{ color: '#C9F31D' }}>
              {item}
              <span style={{ color: '#444' }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-20 pb-12 md:px-12 text-center page-enter">
        <span className="section-label">India's #1 Hoarding Aggregator</span>
        <h1 className="uppercase mx-auto" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(3.5rem, 10vw, 8rem)',
          fontWeight: 900, lineHeight: 0.92,
          letterSpacing: '-0.02em', maxWidth: '900px',
        }}>
          The Complete
          <br />
          <span style={{ color: '#1a3560' }}>Outdoor Ad</span>
          <br />
          Ecosystem
        </h1>
        <p className="mt-6 text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
          AddKaro aggregates hoarding owners, advertisers, print shops, installation teams,
          and maintenance services — everyone in outdoor advertising, one platform.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register"
            className="pulse-glow inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white"
            style={{ background: '#1a3560' }}>
            Browse Hoardings <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold border-2 hover:bg-gray-100 transition-colors"
            style={{ borderColor: '#111', color: '#111' }}>
            Join as a Service Provider
          </Link>
        </div>
      </section>

      {/* ── Animated cityscape ───────────────────────────────────────────── */}
      <div className="w-full overflow-hidden" style={{ marginTop: '-1rem' }}>
        <CityscapeSVG />
      </div>

      {/* ── Who We Serve ─────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:px-12" style={{ background: '#0f0f13' }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-label text-center block" style={{ color: '#555' }}>Who We Serve</span>
          <h2 className="text-center uppercase mb-12 text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900 }}>
            Everyone in Outdoor Advertising
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px stagger-children"
            style={{ background: '#222' }}>
            {WHO_WE_SERVE.map((item) => (
              <div key={item.title} className="p-6 flex flex-col gap-4" style={{ background: '#0f0f13' }}>
                <div className="w-10 h-10 flex items-center justify-center"
                  style={{ background: '#1a3560', color: '#C9F31D' }}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:px-12">
        <div className="max-w-5xl mx-auto">
          <span className="section-label text-center block">How It Works</span>
          <h2 className="text-center uppercase mb-12"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900 }}>
            Simple. Direct. Effective.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 stagger-children">
            {[
              {
                icon: <Building2 className="w-7 h-7" style={{ color: '#1a3560' }} />,
                step: '01',
                title: 'Owners List Hoardings',
                desc: 'Add your billboard with photos, location, dimensions, and pricing. Get discovered instantly.',
              },
              {
                icon: <Eye className="w-7 h-7" style={{ color: '#1a3560' }} />,
                step: '02',
                title: 'Advertisers Browse',
                desc: 'Search by city, area, or footfall. Filter by type and budget. Save favourites to your wishlist.',
              },
              {
                icon: <MessageSquare className="w-7 h-7" style={{ color: '#1a3560' }} />,
                step: '03',
                title: 'Make an Offer & Connect',
                desc: 'Submit an offer with your campaign dates. Chat directly with the owner to close the deal.',
              },
            ].map((item) => (
              <div key={item.step} className="card p-8 border-r border-b" style={{ borderColor: '#e0dbd4' }}>
                <div className="flex items-start justify-between mb-6">
                  {item.icon}
                  <span className="text-5xl font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#e0dbd4', lineHeight: 1 }}>
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#666' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role split ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          <div className="p-10" style={{ background: '#1a3560' }}>
            <MapPin className="w-8 h-8 mb-6" style={{ color: '#C9F31D' }} />
            <h3 className="text-3xl font-black uppercase text-white mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              I Want to Advertise
            </h3>
            <p className="text-sm mb-8" style={{ color: '#a0b4d0' }}>
              Find the perfect billboard for your brand. Filter by location, size, and footfall.
              Submit offers and negotiate directly with owners.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
              style={{ background: '#C9F31D', color: '#111' }}>
              Find Ad Space <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-10 border-2" style={{ borderColor: '#1a3560', background: '#f5f1eb' }}>
            <Handshake className="w-8 h-8 mb-6" style={{ color: '#1a3560' }} />
            <h3 className="text-3xl font-black uppercase mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#111' }}>
              I Own Hoardings
            </h3>
            <p className="text-sm mb-8" style={{ color: '#666' }}>
              List your billboards and reach brands actively looking for outdoor space.
              Manage offers and availability from one dashboard.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white"
              style={{ background: '#1a3560' }}>
              List My Hoarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t"
        style={{ borderColor: '#e0dbd4' }}>
        <span className="text-xl font-black uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#111' }}>
          AddKaro
        </span>
        <p className="text-xs" style={{ color: '#999' }}>
          © {new Date().getFullYear()} AddKaro. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="/login"    className="text-xs font-medium underline-link" style={{ color: '#555' }}>Sign In</Link>
          <Link to="/register" className="text-xs font-medium underline-link" style={{ color: '#555' }}>Register</Link>
        </div>
      </footer>

    </div>
  )
}
