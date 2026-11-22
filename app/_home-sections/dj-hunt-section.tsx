"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import Link from "next/link"
import { ArrowRight, Radio } from "lucide-react"
import { useDJHuntRows } from "@/hooks/_home-sections/use-dj-hunt-rows"

/* ------------------------------------------------------------------ */
/* Tuning                                                              */
/* ------------------------------------------------------------------ */

const CHANNEL_MS = 4000 // time between automatic channel changes
const STATIC_MS = 500 // length of the static transition (picture swaps at the halfway point)
const KNOB_STEP_DEG = 36 // degrees of knob rotation per channel step

// When true, visitors with "reduce motion" turned on get no crawl, no auto channel
// changes and no static. Leave false while you're testing: if your OS has reduce-motion
// enabled, everything animated would otherwise look broken.
const HONOR_REDUCED_MOTION = false

/* ------------------------------------------------------------------ */
/* Textures and shared helpers                                         */
/* ------------------------------------------------------------------ */

// TV static (feTurbulence noise)
const NOISE_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

// GGFM house style, kept consistent across the TV and the stickers:
//  - thick #191919 outlines and white borders
//  - flat, hard offset shadows (no blur)
//  - the brand palette: #569429 green, #ff8c13 orange, #ffcf00 yellow, #e50101 red, #964de0 purple, #f750a3 pink
// The 3D feel comes from gradients, bevels and glass highlights layered on top of that.

// White die-cut outline + GGFM-style hard offset shadow: works for any sticker silhouette
const DIE_CUT =
  "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(1.4px 1.4px 0 #fff) drop-shadow(-1.4px 1.4px 0 #fff) drop-shadow(1.4px -1.4px 0 #fff) drop-shadow(-1.4px -1.4px 0 #fff) drop-shadow(3px 4px 0 #191919)"

const FOOT_BG = "linear-gradient(180deg, #3a3a3d 0%, #191919 100%)"

/** Points for a star / starburst polygon (first point at 12 o'clock). */
function radialPoints(n: number, outer: number, inner: number, cx = 50, cy = 50) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / n - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(" ")
}

/**
 * Wrapper for the illustrated stickers. Position (and visibility) come from className.
 * Pass `inFlow` to make the sticker a normal block instead of absolutely positioned.
 */
function SvgSticker({
  className,
  rotate,
  children,
  inFlow = false,
}: {
  className: string
  rotate: number
  children: ReactNode
  inFlow?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${inFlow ? "" : "absolute"} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, filter: DIE_CUT }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sticker artwork (plain SVG with gradients, no extra library)       */
/* ------------------------------------------------------------------ */

/** Comic speech bubble with halftone shading: the laugh track. */
function LaughBubbleArt() {
  const bubble =
    "M22 4 H118 Q136 4 136 22 V46 Q136 64 118 64 H62 L32 86 L40 64 H22 Q4 64 4 46 V22 Q4 4 22 4 Z"
  const ha = (x: number, y: number, size: number, rot: number, label: string) => (
    <g key={`${x}-${label}`} transform={`rotate(${rot} ${x} ${y - 8})`}>
      <text x={x + 1.6} y={y + 1.8} textAnchor="middle" fontSize={size} fontWeight="900" fill="#191919" className="font-kenyan">
        {label}
      </text>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={size}
        fontWeight="900"
        fill="#9b4dff"
        stroke="#3d1580"
        strokeWidth="1"
        paintOrder="stroke"
        strokeLinejoin="round"
        className="font-kenyan"
      >
        {label}
      </text>
    </g>
  )

  return (
    <svg
      viewBox="0 0 140 90"
      role="presentation"
      className="djhunt-anim block h-auto w-28 lg:w-40 xl:w-48"
      style={{ animation: "djhunt-bob 1.4s ease-in-out infinite" }}
    >
      <defs>
        <linearGradient id="laugh-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9dcff" />
        </linearGradient>
        <pattern id="laugh-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.3" fill="#9b4dff" opacity="0.45" />
        </pattern>
        <linearGradient id="laugh-fade" x1="0.2" y1="0.2" x2="1" y2="1">
          <stop offset="0.5" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="laugh-mask">
          <rect width="140" height="90" fill="url(#laugh-fade)" />
        </mask>
        <clipPath id="laugh-clip">
          <path d={bubble} />
        </clipPath>
        <linearGradient id="laugh-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={bubble} fill="url(#laugh-fill)" stroke="#191919" strokeWidth="3.2" strokeLinejoin="round" />
      <g clipPath="url(#laugh-clip)">
        <rect width="140" height="90" fill="url(#laugh-dots)" mask="url(#laugh-mask)" />
        <ellipse cx="50" cy="14" rx="40" ry="6" fill="url(#laugh-gloss)" />
      </g>
      {ha(36, 46, 24, -8, "HA")}
      {ha(70, 47, 27, 2, "HA")}
      {ha(106, 46, 28, 9, "HA!")}
      {/* sound ticks */}
      <g stroke="#191919" strokeWidth="2.4" strokeLinecap="round">
        <line x1="8" y1="2" x2="14" y2="-1" />
        <line x1="130" y1="2" x2="136" y2="-1" />
        <line x1="2" y1="12" x2="-3" y2="9" />
      </g>
    </svg>
  )
}

/** Backlit studio "APPLAUSE" sign: metal housing, rivets, chasing bulbs, glowing lens. */
function ApplauseArt() {
  const topBottom = Array.from({ length: 15 }, (_, i) => 10 + i * 10)
  const sides = [18, 30, 42]
  let n = 0
  const bulb = (cx: number, cy: number) => {
    const delay = (n++ % 2) * 0.6
    return (
      <g key={`${cx}-${cy}`} className="djhunt-anim" style={{ animation: `djhunt-bulb 1.2s ease-in-out ${delay}s infinite` }}>
        <circle cx={cx} cy={cy} r="3.2" fill="#ffd34a" opacity="0.35" />
        <circle cx={cx} cy={cy} r="1.9" fill="#fff3b0" stroke="#b27a00" strokeWidth="0.5" />
      </g>
    )
  }

  return (
    <svg viewBox="0 0 160 64" role="presentation" className="block h-auto w-32 lg:w-44 xl:w-52">
      <defs>
        <linearGradient id="app-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a6a6d" />
          <stop offset="0.5" stopColor="#363638" />
          <stop offset="1" stopColor="#1b1b1c" />
        </linearGradient>
        <radialGradient id="app-lens" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="0.6" stopColor="#ffc628" />
          <stop offset="1" stopColor="#e88a00" />
        </radialGradient>
        <radialGradient id="app-rivet" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f2f2f2" />
          <stop offset="1" stopColor="#555" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="156" height="60" rx="7" fill="url(#app-metal)" stroke="#0b0b0b" strokeWidth="1.5" />
      <rect x="3.5" y="3.5" width="153" height="57" rx="6" fill="none" stroke="#fff" strokeOpacity="0.2" />
      {[[7, 7], [153, 7], [7, 57], [153, 57]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" fill="url(#app-rivet)" stroke="#222" strokeWidth="0.4" />
      ))}
      {topBottom.map((x) => bulb(x, 7))}
      {topBottom.map((x) => bulb(x, 57))}
      {sides.map((y) => bulb(6, y))}
      {sides.map((y) => bulb(154, y))}
      <rect x="14" y="13" width="132" height="38" rx="3" fill="#120a00" />
      <rect x="16" y="15" width="128" height="34" rx="2" fill="url(#app-lens)" />
      <rect
        x="16"
        y="15"
        width="128"
        height="34"
        rx="2"
        fill="#fff"
        className="djhunt-anim"
        style={{ animation: "djhunt-lens 1.6s ease-in-out infinite" }}
        opacity="0"
      />
      <text
        x="80"
        y="39"
        textAnchor="middle"
        fontSize="19"
        fontWeight="900"
        fill="#2b1300"
        textLength="112"
        lengthAdjust="spacingAndGlyphs"
        className="font-kenyan"
      >
        APPLAUSE
      </text>
      <rect x="16" y="15" width="128" height="12" rx="2" fill="#fff" opacity="0.18" />
    </svg>
  )
}

/** Dressing-room door: wood panel, brass plate with screws, embossed gold star. */
function DoorStarArt() {
  const grain = [
    "M10 22 Q60 14 110 24",
    "M10 40 Q55 34 110 42",
    "M10 62 Q70 56 110 64",
    "M10 86 Q50 80 110 90",
    "M10 108 Q65 102 110 110",
    "M10 130 Q60 124 110 132",
  ]
  return (
    <svg viewBox="0 0 120 150" role="presentation" className="block h-auto w-20 lg:w-28 xl:w-32">
      <defs>
        <linearGradient id="door-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8803f" />
          <stop offset="1" stopColor="#6f4220" />
        </linearGradient>
        <linearGradient id="door-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f5b2c" />
          <stop offset="1" stopColor="#5e3719" />
        </linearGradient>
        <linearGradient id="door-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2ad" />
          <stop offset="0.45" stopColor="#e0ac26" />
          <stop offset="1" stopColor="#9a6c0b" />
        </linearGradient>
        <radialGradient id="door-star" cx="0.4" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#fff8c4" />
          <stop offset="0.55" stopColor="#f0b90f" />
          <stop offset="1" stopColor="#a87800" />
        </radialGradient>
        <radialGradient id="door-screw" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#7a6020" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="112" height="142" rx="8" fill="url(#door-wood)" stroke="#2f1a0a" strokeWidth="2" />
      <g fill="none" stroke="#3d2210" strokeOpacity="0.35" strokeWidth="1.2">
        {grain.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <rect x="14" y="14" width="92" height="122" rx="4" fill="url(#door-panel)" stroke="#2f1a0a" strokeWidth="1.5" />
      <rect x="15.5" y="15.5" width="89" height="119" rx="3" fill="none" stroke="#fff" strokeOpacity="0.18" />
      {/* brass plate */}
      <rect x="22" y="24" width="76" height="102" rx="6" fill="url(#door-brass)" stroke="#5e4003" strokeWidth="1.6" />
      <rect x="26" y="28" width="68" height="94" rx="4" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
      {[[29, 31], [91, 31], [29, 119], [91, 119]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="2.7" fill="url(#door-screw)" stroke="#5e4003" strokeWidth="0.6" />
          <line x1={cx - 1.7} y1={cy + 1.2} x2={cx + 1.7} y2={cy - 1.2} stroke="#5e4003" strokeWidth="0.7" />
        </g>
      ))}
      {/* embossed star */}
      <polygon points={radialPoints(5, 29, 11.8, 61, 62)} fill="#6a4600" opacity="0.5" transform="translate(1.6 2.2)" />
      <polygon points={radialPoints(5, 29, 11.8, 60, 61)} fill="url(#door-star)" stroke="#7a5200" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points={radialPoints(5, 23, 9.2, 59.4, 60.4)} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" strokeLinejoin="round" />
      {/* engraved lettering */}
      <g textAnchor="middle" fontWeight="900" className="font-kenyan">
        <text x="60.8" y="103.8" fontSize="13" fill="#fff" opacity="0.6">GUEST</text>
        <text x="60" y="103" fontSize="13" fill="#6a4600">GUEST</text>
        <text x="60.8" y="119.8" fontSize="15" fill="#fff" opacity="0.6">STAR</text>
        <text x="60" y="119" fontSize="15" fill="#6a4600">STAR</text>
      </g>
    </svg>
  )
}

/** Barcode bars (horizontal, 35 x 14). */
function Barcode() {
  const widths = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3]
  let x = 0
  return (
    <>
      {widths.map((w, i) => {
        const bar = <rect key={i} x={x} y={0} width={w} height={14} fill="#fff" />
        x += w + 1
        return bar
      })}
    </>
  )
}

/** Studio-audience ticket: perforated stub, barcode, misprint-style shadow and a peeling corner. */
function TicketArt() {
  const body =
    "M10 4 H170 a6 6 0 0 1 6 6 V36 a12 12 0 0 0 0 24 V86 a6 6 0 0 1 -6 6 H26 L4 70 V60 a12 12 0 0 0 0 -24 V10 a6 6 0 0 1 6 -6 Z"
  return (
    <svg viewBox="0 0 180 96" role="presentation" className="block h-auto w-28 lg:w-40 xl:w-48">
      <defs>
        <linearGradient id="tix-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff74bb" />
          <stop offset="1" stopColor="#d02a82" />
        </linearGradient>
        <linearGradient id="tix-gloss" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tix-flap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9c9c9" />
        </linearGradient>
      </defs>
      <path d={body} fill="url(#tix-fill)" stroke="#191919" strokeWidth="2.4" strokeLinejoin="round" />
      <path d={body} fill="url(#tix-gloss)" />
      {/* printed rules */}
      <g stroke="#fff" strokeOpacity="0.7" strokeWidth="1">
        <line x1="18" y1="26" x2="124" y2="26" />
        <line x1="18" y1="58" x2="124" y2="58" />
      </g>
      <g textAnchor="middle" fill="#fff" className="font-secondary" fontWeight="800">
        <text x="71" y="20" fontSize="7.5" letterSpacing="1.8">STUDIO AUDIENCE</text>
      </g>
      {/* misprint shadow + main title */}
      <text x="71.6" y="51.8" textAnchor="middle" fontSize="24" fontWeight="900" fill="#7a0f48" textLength="104" lengthAdjust="spacingAndGlyphs" className="font-kenyan">
        ADMIT ONE
      </text>
      <text x="70" y="50" textAnchor="middle" fontSize="24" fontWeight="900" fill="#fff" textLength="104" lengthAdjust="spacingAndGlyphs" className="font-kenyan">
        ADMIT ONE
      </text>
      <g textAnchor="middle" fill="#fff" className="font-secondary" fontWeight="800">
        <text x="71" y="70" fontSize="8" letterSpacing="1">ROW A · SEAT 7</text>
        <text x="71" y="82" fontSize="7" letterSpacing="2" opacity="0.85">★ GGFM LIVE ★</text>
      </g>
      {/* perforation + stub */}
      <line x1="131" y1="10" x2="131" y2="86" stroke="#fff" strokeWidth="1.6" strokeDasharray="3.2 3.2" />
      <g transform="translate(155 48) rotate(90) translate(-17.5 -7)">
        <Barcode />
      </g>
      <text x="140" y="48" transform="rotate(90 140 48)" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fff" letterSpacing="1" className="font-secondary">
        NO. 0042
      </text>
      {/* peeling corner */}
      <polygon points="4,70 26,92 31,75" fill="#000" opacity="0.28" />
      <polygon points="4,70 26,92 26,70" fill="url(#tix-flap)" stroke="#bdbdbd" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  )
}

/** Telescoping rabbit-ear antenna on a hinged dome base. */
function AntennaArt() {
  const segments = [
    { x1: 110, y1: 66, x2: 84, y2: 46, w: 5 },
    { x1: 84, y1: 46, x2: 60, y2: 28, w: 3.4 },
    { x1: 60, y1: 28, x2: 40, y2: 13, w: 2 },
  ]
  const rod = (
    <g strokeLinecap="round">
      {segments.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#5b6166" strokeWidth={s.w + 1.2} />
          <line x1={s.x1 - 0.7} y1={s.y1 - 0.7} x2={s.x2 - 0.7} y2={s.y2 - 0.7} stroke="#eef1f3" strokeWidth={s.w * 0.45} />
        </g>
      ))}
      <circle cx="84" cy="46" r="3.6" fill="#8b9196" stroke="#4a4f53" />
      <circle cx="60" cy="28" r="2.8" fill="#8b9196" stroke="#4a4f53" />
      <circle cx="38" cy="11" r="4" fill="url(#ant-ball)" stroke="#2a2a2a" />
    </g>
  )
  return (
    <svg viewBox="0 0 220 90" role="presentation" className="relative z-0 mx-auto -mb-2 block w-36 sm:w-44">
      <defs>
        <radialGradient id="ant-ball" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c8ccd0" />
          <stop offset="1" stopColor="#585d62" />
        </radialGradient>
        <linearGradient id="ant-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d4d50" />
          <stop offset="1" stopColor="#101011" />
        </linearGradient>
      </defs>
      {rod}
      <g transform="translate(220 0) scale(-1 1)">{rod}</g>
      <path d="M72 90 Q80 60 110 58 Q140 60 148 90 Z" fill="url(#ant-base)" stroke="#000" strokeWidth="1.5" />
      <path d="M84 79 Q110 62 136 79" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
      <circle cx="110" cy="66" r="5.5" fill="url(#ant-ball)" stroke="#222" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* TV hardware                                                         */
/* ------------------------------------------------------------------ */

/** Little phillips-head screw. */
function Screw({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute block h-2 w-2 rounded-full ${className}`}
      style={{
        background:
          "linear-gradient(45deg, transparent 44%, rgba(0,0,0,0.65) 44% 56%, transparent 56%), radial-gradient(circle at 35% 30%, #f0f0f0, #6f6f6f)",
        boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
      }}
    />
  )
}

/** Decorative (non-interactive) ridged dial. */
function Knob({ rotate, className, cap }: { rotate: number; className: string; cap: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 rounded-full ${className}`}
      style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.65), 0 0 0 2px #070707" }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle, transparent 52%, rgba(0,0,0,0.55) 100%), repeating-conic-gradient(#56565a 0deg 6deg, #1b1b1d 6deg 12deg)",
          transform: `rotate(${rotate}deg)`,
        }}
      >
        <span
          className="absolute inset-[22%] rounded-full"
          style={{
            background: cap,
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.7), 0 0 0 1px #111",
          }}
        >
          <span className="absolute left-1/2 top-0.5 h-[30%] w-0.5 -translate-x-1/2 rounded-full bg-[#191919]" />
        </span>
      </span>
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(ellipse at 30% 22%, rgba(255,255,255,0.32), transparent 45%)" }}
      />
    </span>
  )
}

/** Printed dial plate that sits behind the channel knob. */
function DialPlate() {
  return (
    <svg viewBox="0 0 88 88" role="presentation" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="plate-fill" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#3a3a3d" />
          <stop offset="1" stopColor="#0f0f10" />
        </radialGradient>
      </defs>
      <circle cx="44" cy="44" r="43" fill="url(#plate-fill)" stroke="#000" strokeWidth="1.5" />
      <circle cx="44" cy="44" r="41" fill="none" stroke="#fff" strokeOpacity="0.16" />
      {Array.from({ length: 18 }, (_, i) => {
        const a = ((i * 20 + 10) * Math.PI) / 180
        const long = i % 3 === 0
        const r1 = long ? 35 : 37
        const r2 = 41
        return (
          <line
            key={i}
            x1={44 + r1 * Math.sin(a)}
            y1={44 - r1 * Math.cos(a)}
            x2={44 + r2 * Math.sin(a)}
            y2={44 - r2 * Math.cos(a)}
            stroke="#dcdcdc"
            strokeOpacity="0.85"
            strokeWidth={long ? 1.6 : 1}
            strokeLinecap="round"
          />
        )
      })}
      <polygon points="44,6 40.5,0.5 47.5,0.5" fill="#ff8c13" />
    </svg>
  )
}

/**
 * Rotary channel knob.
 *  - Drag around the knob: clockwise = next channel, counter-clockwise = previous
 *    (mouse, touch and pen all work; the knob rotates with your finger).
 *  - Tap/click: right half = next, left half = previous.
 *  - Keyboard: arrow keys (right/up = next, left/down = previous).
 */
type DragState = { cx: number; cy: number; last: number; acc: number; moved: boolean }

function ChannelKnob({
  steps,
  onStep,
  valueNow,
  valueMax,
  valueText,
}: {
  steps: number // total detent steps turned so far (manual and automatic); drives the rotation
  onStep: (dir: 1 | -1) => void
  valueNow: number
  valueMax: number
  valueText: string
}) {
  const [dragOffset, setDragOffset] = useState(0) // live rotation while a finger/mouse is down
  const [dragging, setDragging] = useState(false)
  const drag = useRef<DragState | null>(null)
  const angle = steps * KNOB_STEP_DEG + dragOffset

  const commit = (dir: 1 | -1) => onStep(dir)

  const pointerAngle = (e: ReactPointerEvent<HTMLDivElement>, cx: number, cy: number) =>
    (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { cx, cy, last: pointerAngle(e, cx, cy), acc: 0, moved: false }
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const a = pointerAngle(e, d.cx, d.cy)
    let delta = a - d.last
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    d.last = a
    d.acc += delta
    if (Math.abs(d.acc) > 4) d.moved = true
    while (d.acc >= KNOB_STEP_DEG) {
      d.acc -= KNOB_STEP_DEG
      commit(1)
    }
    while (d.acc <= -KNOB_STEP_DEG) {
      d.acc += KNOB_STEP_DEG
      commit(-1)
    }
    setDragOffset(d.acc)
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    setDragging(false)
    // A tap (no real rotation): right half = next, left half = previous
    if (d && !d.moved && e.type === "pointerup") {
      commit(e.clientX < d.cx ? -1 : 1)
    }
    setDragOffset(0) // snap to the detent
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      commit(1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      commit(-1)
    }
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Channel"
      aria-orientation="horizontal"
      aria-valuemin={valueMax ? 1 : 0}
      aria-valuemax={valueMax}
      aria-valuenow={valueNow}
      aria-valuetext={valueText}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className="relative h-16 w-16 shrink-0 cursor-grab touch-none select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff8c13] active:cursor-grabbing"
      style={{ boxShadow: "0 5px 8px rgba(0,0,0,0.7), 0 0 0 2px #070707" }}
    >
      {/* Rotating part: ridged skirt, metal cap, orange pointer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle, transparent 54%, rgba(0,0,0,0.55) 100%), repeating-conic-gradient(#56565a 0deg 5deg, #1b1b1d 5deg 10deg)",
          transform: `rotate(${angle}deg)`,
          transition: dragging ? "none" : "transform 350ms ease-out",
        }}
      >
        <span
          className="absolute inset-2.25 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, #ff8a7a 0%, #e50101 45%, #8f0000 100%)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.5), 0 0 0 1.5px #111",
          }}
        >
          <span className="absolute left-1/2 top-0.75 h-3 w-0.75 -translate-x-1/2 rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.9)]" />
        </span>
      </div>
      {/* Fixed specular highlight (does not rotate) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(ellipse at 30% 22%, rgba(255,255,255,0.35), transparent 45%)" }}
      />
    </div>
  )
}

const SCREEN_BG: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 40%, #6fb33a 0%, #43801f 60%, #1f3d0e 100%)",
  backgroundSize: "18px 18px, 100% 100%",
}

const PRINTED_LABEL = "font-secondary text-[8px] font-extrabold uppercase tracking-widest text-white/55"
const DECK_LABEL = "font-secondary text-[8px] font-extrabold uppercase tracking-widest text-[#191919]/80"

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function DjHuntSection() {
  const { finalists } = useDJHuntRows()
  const count = finalists.length

  const [index, setIndex] = useState(0)
  const [tuning, setTuning] = useState(false)
  const [tuneKey, setTuneKey] = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const [knobSteps, setKnobSteps] = useState(0) // grows with every channel change, auto or manual
  const [osReduceMotion, setOsReduceMotion] = useState(false)
  const tuningOff = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reduceMotion = HONOR_REDUCED_MOTION && osReduceMotion
  const current = count > 0 ? finalists[index % count] : undefined

  useEffect(() => {
    if (!HONOR_REDUCED_MOTION) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setOsReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setOsReduceMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(
    () => () => {
      if (tuningOff.current) clearTimeout(tuningOff.current)
    },
    [],
  )

  // Static flash covers the screen, the picture swaps while it's fully opaque, then it clears.
  const changeChannel = useCallback(
    (delta: number) => {
      if (count < 2) return
      setKnobSteps((s) => s + delta) // the knob turns on every change, including the timed ones
      const wrap = (i: number) => (i + delta + count) % count
      if (reduceMotion) {
        setIndex(wrap)
        return
      }
      setTuning(true)
      setTuneKey((k) => k + 1)
      setTimeout(() => setIndex(wrap), STATIC_MS / 2)
      if (tuningOff.current) clearTimeout(tuningOff.current)
      tuningOff.current = setTimeout(() => setTuning(false), STATIC_MS)
    },
    [count, reduceMotion],
  )

  // Fixed-interval channel surfing. Turning the knob restarts the clock.
  useEffect(() => {
    if (reduceMotion || count < 2) return
    const id = setInterval(() => changeChannel(1), CHANNEL_MS)
    return () => clearInterval(id)
  }, [reduceMotion, count, changeChannel, timerKey])

  const handleKnobStep = (dir: 1 | -1) => {
    changeChannel(dir)
    setTimerKey((k) => k + 1)
  }

  return (
    <section
      id="dj-hunt"
      className="relative overflow-hidden bg-[#569429] px-6 py-12 sm:px-10 sm:py-14 lg:flex lg:h-[calc(100svh-5rem)] lg:min-h-112 lg:items-center lg:px-16 lg:py-4"
    >
      <style>{`
        @keyframes djhunt-static {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-8%, 4%); }
          50% { transform: translate(6%, -6%); }
          75% { transform: translate(-4%, -8%); }
          100% { transform: translate(0, 0); }
        }
        @keyframes djhunt-static-flash {
          0% { opacity: 0; }
          25% { opacity: 1; }
          65% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes djhunt-crawl {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes djhunt-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.97; }
          52% { opacity: 0.92; }
          54% { opacity: 0.98; }
        }
        @keyframes djhunt-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.07); }
        }
        @keyframes djhunt-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes djhunt-lens {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.35; }
        }
        @keyframes djhunt-bulb {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        /* On large screens, scale the content down on short windows so the whole section fits with the navbar */
        @media (min-width: 1024px) and (max-height: 800px) { .djhunt-fit { zoom: 0.88; } }
        @media (min-width: 1024px) and (max-height: 720px) { .djhunt-fit { zoom: 0.76; } }
        @media (min-width: 1024px) and (max-height: 640px) { .djhunt-fit { zoom: 0.64; } }
        ${
          HONOR_REDUCED_MOTION
            ? "@media (prefers-reduced-motion: reduce) { .djhunt-anim { animation: none !important; } }"
            : ""
        }
      `}</style>

      {/* Original diagonal stripes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage:
            "repeating-linear-gradient(45deg, #191919 0, #191919 2px, transparent 2px, transparent 14px)",
        }}
      />

      {/* 90s "Memphis" squiggles, triangles, dots and crosses */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.12 }}
      >
        <defs>
          <pattern id="djhunt-home-memphis" width="180" height="180" patternUnits="userSpaceOnUse">
            <path
              d="M14 32 q10 -14 20 0 t20 0 t20 0"
              fill="none"
              stroke="#191919"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="124,24 144,60 104,60" fill="none" stroke="#ffffff" strokeWidth="3" />
            <circle cx="44" cy="124" r="7" fill="#191919" />
            <circle cx="68" cy="142" r="3" fill="#ffffff" />
            <path d="M118 118 l24 24 M142 118 l-24 24" stroke="#191919" strokeWidth="4" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#djhunt-home-memphis)" />
      </svg>

      <div className="djhunt-fit relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
        {/* Left column: text, button, small stickers */}
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          {/* ON AIR style tag */}
          <span className="inline-flex items-center gap-2 rounded-sm border-2 border-white bg-[#191919] px-4 py-1.5 font-secondary text-xs font-extrabold uppercase tracking-[0.25em] text-white">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#e50101]" />
            <Radio className="h-3.5 w-3.5" />
            DJ Hunt
          </span>

          {/* Title-card heading */}
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <p className="font-secondary text-xs font-extrabold uppercase tracking-[0.35em] text-[#191919] sm:text-sm">
              Starring
            </p>
            <h2
              className="max-w-3xl -rotate-1 font-kenyan text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ textShadow: "3px 3px 0 #191919" }}
            >
              The Next Voices of Green Giant FM.
            </h2>
          </div>

          <p className="max-w-lg font-secondary text-base font-medium leading-relaxed text-[#191919] sm:text-lg">
            17 finalists are in the running for a chance to be one of our newest DJ Trainees. Show your support and help decide who joins the roster.
          </p>

          <Link
            href="/polls/dj-hunt"
            className="group hidden lg:inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-[#191919] px-8 py-4 font-secondary text-sm font-extrabold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-[#191919] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#569429]"
            style={{ animation: "ggfm-pulse-ring 2.4s ease-out infinite" }}
          >
            Support Your Finalist
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Retro TV (square screen)                                    */}
        {/* ---------------------------------------------------------- */}
        <div
          role="group"
          aria-label="Finalists television"
          className="relative mx-auto mt-2 w-full max-w-88 lg:mx-0 lg:w-88"
        >
          {/* Stickers slapped onto the TV's top corners */}
          {/* Top left: applause sign */}
          <SvgSticker rotate={-6} className="-left-3 -top-4 z-20 lg:-left-20 lg:-top-1 xl:-left-28">
            <ApplauseArt />
          </SvgSticker>
          {/* Top right: laugh bubble */}
          <SvgSticker rotate={7} className="-right-3 -top-6 z-20 lg:-right-16 lg:-top-3 xl:-right-24">
            <LaughBubbleArt />
          </SvgSticker>
          {/* Bottom left: dressing-room star door */}
          <SvgSticker rotate={-7} className="-bottom-6 -left-3 z-20 lg:-bottom-8 lg:-left-14 xl:-bottom-10 xl:-left-20">
            <DoorStarArt />
          </SvgSticker>
          {/* Bottom right: studio ticket */}
          <SvgSticker rotate={6} className="-bottom-6 -right-3 z-20 lg:-bottom-8 lg:-right-16 xl:-bottom-10 xl:-right-24">
            <TicketArt />
          </SvgSticker>

          <AntennaArt />

          {/* Cream plastic cabinet: thick GGFM outline + hard offset shadow, soft bevel for depth */}
          <div
            className="relative z-10 rounded-[1.75rem] border-4 border-[#191919] p-3 sm:p-4"
            style={{
              background: "linear-gradient(180deg, #fbf5e1 0%, #f2e8cf 50%, #dccfa8 100%)",
              boxShadow:
                "8px 8px 0 #191919, inset 0 3px 2px rgba(255,255,255,0.9), inset 0 -6px 8px rgba(120,95,40,0.35), inset 3px 0 6px rgba(255,255,255,0.35), inset -3px 0 6px rgba(120,95,40,0.2)",
            }}
          >
            {/* Molded plastic bezel with a chin for the badge */}
            <div
              className="relative rounded-3xl p-2.5 pb-9 sm:p-3.5 sm:pb-10"
              style={{
                background: "linear-gradient(145deg, #34343a 0%, #1f1f22 55%, #191919 100%)",
                boxShadow:
                  "0 0 0 3px #191919, inset 0 0 0 2px rgba(255,255,255,0.35), inset 0 3px 3px rgba(255,255,255,0.2), inset 0 -4px 7px rgba(0,0,0,0.8)",
              }}
            >
              {/* Recessed lip around the tube */}
              <div
                className="rounded-[1.25rem]"
                style={{
                  boxShadow:
                    "0 0 0 2px #050505, 0 0 0 5px #2c2c2f, 0 0 0 6px #000, inset 0 0 0 1px rgba(255,255,255,0.1)",
                }}
              >
                {/* CRT glass (square) */}
                <div className="relative aspect-square overflow-hidden rounded-[1.15rem]" style={SCREEN_BG}>
                  {/* Picture: every finalist is stacked and switched by opacity, so images are preloaded */}
                  <div
                    className="djhunt-anim absolute inset-0 z-10"
                    style={{ animation: "djhunt-flicker 6s linear infinite" }}
                  >
                    {count > 0 ? (
                      finalists.map((finalist, i) => (
                        <img
                          key={finalist.id}
                          src={finalist.image}
                          alt={i === index % count ? finalist.name : ""}
                          title={finalist.name}
                          aria-hidden={i === index % count ? undefined : true}
                          className={`absolute inset-0 h-full w-full object-cover ${
                            i === index % count ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono text-sm font-bold uppercase tracking-widest text-white/80">
                        Tuning in…
                      </div>
                    )}

                    {/* Endless news-style crawl (list is doubled; -50% lands exactly on the repeat) */}
                    {count > 0 && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-7 overflow-hidden border-t border-white/40"
                        style={{ background: "linear-gradient(180deg, rgba(40,40,42,0.92), rgba(8,8,9,0.95))" }}
                      >
                        <div
                          className="djhunt-anim flex h-full w-max items-center gap-6 whitespace-nowrap pr-6 will-change-transform"
                          style={{ animation: `djhunt-crawl ${Math.max(24, count * 2.5)}s linear infinite` }}
                        >
                          {[...finalists, ...finalists].map((finalist, i) => (
                            <span
                              key={`${finalist.id}-${i}`}
                              className="font-secondary text-[10px] font-extrabold uppercase tracking-widest text-white"
                            >
                              <span className="mr-2 text-[#ffcf00]">★</span>
                              {finalist.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Glass: scanlines */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0, rgba(0,0,0,0.13) 1px, transparent 1px, transparent 3px)",
                    }}
                  />
                  {/* Glass: tube curvature, vignette and phosphor glow at the edges */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                      background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)",
                      boxShadow:
                        "inset 0 0 0 2px rgba(0,0,0,0.9), inset 0 0 44px rgba(0,0,0,0.6), inset 0 0 14px rgba(140,255,110,0.18)",
                    }}
                  />
                  {/* Glass: curved highlight + diagonal sheen */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                      mixBlendMode: "screen",
                      background:
                        "radial-gradient(ellipse at 22% 14%, rgba(255,255,255,0.34), transparent 42%), linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 24%, transparent 40%)",
                    }}
                  />
                  {/* Glass: window reflection */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[9%] top-[9%] z-20 flex h-[19%] w-[26%] gap-[4%] opacity-70"
                    style={{ transform: "skewX(-6deg) rotate(-2deg)", filter: "blur(0.7px)" }}
                  >
                    <span
                      className="flex-1 rounded-[3px]"
                      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.24), rgba(255,255,255,0.03))" }}
                    />
                    <span
                      className="flex-1 rounded-[3px]"
                      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.2), rgba(255,255,255,0.02))" }}
                    />
                  </div>
                  {/* Glass: faint bounce light along the bottom edge */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{ background: "linear-gradient(to top, rgba(255,255,255,0.08), transparent 7%)" }}
                  />

                  {/* Channel-change static: fades in, picture swaps underneath, fades out */}
                  {tuning && (
                    <div
                      key={tuneKey}
                      aria-hidden="true"
                      className="djhunt-anim pointer-events-none absolute inset-0 z-30 overflow-hidden bg-[#8d8d8d]"
                      style={{ animation: `djhunt-static-flash ${STATIC_MS}ms linear both` }}
                    >
                      <div
                        className="djhunt-anim absolute -inset-6"
                        style={{
                          backgroundImage: NOISE_BG,
                          backgroundSize: "160px 160px",
                          filter: "contrast(1.7) brightness(1.15)",
                          animation: "djhunt-static 0.2s steps(4) infinite",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Chin: printed text, chrome badge, power LED */}
              <span aria-hidden="true" className={`absolute bottom-2.5 left-4 sm:left-5 ${PRINTED_LABEL}`}>
                Stereo
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md border-2 border-white px-3 py-px font-kenyan text-[10px] uppercase tracking-[0.3em] text-white sm:text-[11px]"
                style={{
                  background: "linear-gradient(180deg, #7bc443 0%, #569429 50%, #3f7a1d 100%)",
                  boxShadow: "2px 2px 0 #000, inset 0 1px 0 rgba(255,255,255,0.6)",
                  textShadow: "1px 1px 0 #191919",
                }}
              >
                GGFM
              </span>
              <span aria-hidden="true" className="absolute bottom-2.5 right-4 flex items-center gap-1.5 sm:right-5">
                <span className={PRINTED_LABEL}>Pwr</span>
                <span className="block h-2 w-2 animate-pulse rounded-full bg-[#ff2a1a] shadow-[0_0_8px_2px_rgba(255,40,26,0.7)]" />
              </span>
            </div>

            {/* 90s racing stripe in GGFM colours */}
            <div
              aria-hidden="true"
              className="mt-3 flex h-3 overflow-hidden rounded-full border-2 border-[#191919] sm:mt-4"
            >
              <span className="flex-1 bg-[#e50101]" />
              <span className="flex-1 bg-[#ff8c13]" />
              <span className="flex-1 bg-[#ffcf00]" />
              <span className="flex-1 bg-[#569429]" />
            </div>

            {/* Control deck under the screen */}
            <div
              className="mt-3 flex items-center justify-between gap-2 rounded-2xl p-2.5 sm:mt-4 sm:gap-3 sm:p-3"
              style={{
                background: "linear-gradient(180deg, #ffa83a 0%, #ff8c13 50%, #d96f00 100%)",
                boxShadow:
                  "0 0 0 3px #191919, inset 0 2px 2px rgba(255,255,255,0.55), inset 0 -4px 6px rgba(120,50,0,0.5)",
              }}
            >
              {/* Speaker grille */}
              <div
                aria-hidden="true"
                className="h-14 w-12 shrink-0 rounded-md sm:h-16 sm:w-20"
                style={{
                  background: "repeating-linear-gradient(0deg, #050505 0 3px, #34312d 3px 4px)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.14)",
                }}
              />

              {/* Channel dial: printed plate + draggable knob */}
              <div className="relative h-22 w-22 shrink-0">
                <DialPlate />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChannelKnob
                    steps={knobSteps}
                    onStep={handleKnobStep}
                    valueNow={count ? (index % count) + 1 : 0}
                    valueMax={count}
                    valueText={current ? `Channel ${(index % count) + 1}: ${current.name}` : "No signal"}
                  />
                </div>
              </div>

              {/* Volume dial + push button (decorative) */}
              <div className="flex shrink-0 items-end gap-2 sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Knob
                    rotate={50}
                    className="h-9 w-9"
                    cap="radial-gradient(circle at 35% 30%, #fff3a0 0%, #ffcf00 45%, #b88f00 100%)"
                  />
                  <span aria-hidden="true" className={DECK_LABEL}>
                    Vol
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="block h-5 w-7 rounded-[3px]"
                    style={{
                      background: "linear-gradient(180deg, #fff09a 0%, #ffcf00 55%, #c79b00 100%)",
                      boxShadow: "2px 3px 0 #191919, 0 0 0 2px #191919, inset 0 1px 1px rgba(255,255,255,0.8)",
                    }}
                  />
                  <span aria-hidden="true" className={DECK_LABEL}>
                    Menu
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tapered feet */}
          <div aria-hidden="true" className="relative z-0 mx-auto -mt-1 flex w-[78%] justify-between px-4">
            <span
              className="block h-5 w-10"
              style={{ background: FOOT_BG, clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)" }}
            />
            <span
              className="block h-5 w-10"
              style={{ background: FOOT_BG, clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)" }}
            />
          </div>
          {/* Hard-edged floor shadow */}
          <div aria-hidden="true" className="mx-auto -mt-2 h-3 w-[92%] rounded-[50%] bg-[#191919]/30" />
        </div>

        {/* Mobile / tablet: button sits below the TV (on large screens it lives in the left column) */}
        <div className="mt-4 flex justify-center lg:hidden">
          <Link
            href="/polls/dj-hunt"
            className="group inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-[#191919] px-8 py-4 font-secondary text-sm font-extrabold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-[#191919] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#569429]"
            style={{ animation: "ggfm-pulse-ring 2.4s ease-out infinite" }}
          >
            Support Your Finalist
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}