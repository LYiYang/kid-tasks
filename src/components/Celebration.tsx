import { useEffect, useState } from 'react';
import './Celebration.css';

const PRASES = [
  '太强了！💪',
  '一击必中！🎯',
  '连击好耶！⚡',
  '金币 +100！🪙',
  '等级提升！🚀',
  '完美通关！🏆',
  '干得漂亮！🔥',
  '大魔王就是你！👑',
];

const CONFETTI_COLORS = [
  '#ec4899',
  '#8b5cf6',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
];

const EMOJIS = ['⭐', '🔥', '💥', '✨', '🎉', '🧨', '🚀', '💎'];

const CONFETTI_COUNT = 90;

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
  emoji?: string;
}

function makePieces(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.4 + Math.random() * 1.4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 8,
    emoji: i % 5 === 0 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : undefined,
  }));
}

export function Celebration({ onDone }: { onDone: () => void }) {
  const [pieces] = useState(makePieces);
  const [phrase] = useState(
    () => PRASES[Math.floor(Math.random() * PRASES.length)],
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="celebration-overlay" role="status" aria-live="polite">
      <div className="celebration-phrase">{phrase}</div>
      {pieces.map((p) =>
        p.emoji ? (
          <span
            key={p.id}
            className="confetti-emoji"
            style={
              {
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                fontSize: `${p.size * 1.6}px`,
              } as React.CSSProperties
            }
          >
            {p.emoji}
          </span>
        ) : (
          <span
            key={p.id}
            className="confetti"
            style={
              {
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                backgroundColor: p.color,
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: `rotate(${p.rotate}deg)`,
              } as React.CSSProperties
            }
          />
        ),
      )}
    </div>
  );
}
