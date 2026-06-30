import { HexMark } from './Logo';

/**
 * Animated auth backdrop ported from the original sasol-attendance AuthLayout:
 * 3D gradient "bubbles" + floating hexagon marks, all in the active brand color.
 * Purely decorative (aria-hidden, pointer-events none).
 */

interface Bubble {
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  duration: number;
  delay: number;
}

const BUBBLES: Bubble[] = [
  { size: 100, top: '10%', left: '5%', duration: 8, delay: 0 },
  { size: 150, bottom: '15%', right: '10%', duration: 10, delay: 0 },
  { size: 80, top: '60%', left: '15%', duration: 12, delay: 0 },
  { size: 60, top: '30%', left: '25%', duration: 9, delay: 1 },
  { size: 120, bottom: '35%', right: '20%', duration: 14, delay: 2 },
  { size: 50, top: '75%', right: '30%', duration: 11, delay: 3 },
  { size: 90, top: '20%', right: '15%', duration: 13, delay: 1.5 },
];

interface Mark {
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  duration: number;
  delay: number;
  opacity: number;
}

const MARKS: Mark[] = [
  { size: 220, top: '8%', right: '14%', duration: 20, delay: 0, opacity: 0.22 },
  { size: 120, bottom: '14%', left: '9%', duration: 15, delay: 2, opacity: 0.18 },
  { size: 170, top: '62%', right: '24%', duration: 26, delay: 1, opacity: 0.16 },
  { size: 100, top: '24%', left: '18%', duration: 18, delay: 0.5, opacity: 0.2 },
];

export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft brand wash */}
      <div className="absolute inset-0 bg-brand-soft" />

      {/* Floating hexagon marks */}
      {MARKS.map((m, i) => (
        <div
          key={`mark-${i}`}
          className="anim-molecule absolute"
          style={{
            top: m.top,
            bottom: m.bottom,
            left: m.left,
            right: m.right,
            opacity: m.opacity,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            filter: 'drop-shadow(0 8px 16px rgba(15,23,42,0.12))',
          }}
        >
          <HexMark size={m.size} />
        </div>
      ))}

      {/* 3D gradient bubbles */}
      {BUBBLES.map((b, i) => (
        <div
          key={`bubble-${i}`}
          className="brand-bubble anim-float absolute"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
