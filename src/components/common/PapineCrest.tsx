import React from 'react';

interface CrestProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const PapineCrest: React.FC<CrestProps> = ({
  className = '',
  size = 48,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
      >
        {/* Shield Outer Gold Border */}
        <path
          d="M50 4C78 4 92 18 92 46C92 74 65 92 50 98C35 92 8 74 8 46C8 18 22 4 50 4Z"
          fill="#D97706"
          stroke="#B45309"
          strokeWidth="1.5"
        />

        {/* Shield Inner Navy Blue Field */}
        <path
          d="M50 7C75 7 88 20 88 46C88 71 63 88 50 94C37 88 12 71 12 46C12 20 25 7 50 7Z"
          fill="#0B2545"
        />

        {/* Diagonal Cross / Quartering Band (Jamaican Gold Accent) */}
        <path
          d="M14 26L86 66L84 72L12 32Z"
          fill="#F59E0B"
          opacity="0.3"
        />
        <path
          d="M86 26L14 66L16 72L88 32Z"
          fill="#10B981"
          opacity="0.3"
        />

        {/* Open Book of Knowledge in Top Shield */}
        <path
          d="M32 30C38 27 45 28 50 31C55 28 62 27 68 30V44C62 41 55 42 50 45C45 42 38 41 32 44V30Z"
          fill="#F8FAFC"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
        {/* Book spine line */}
        <line x1="50" y1="31" x2="50" y2="45" stroke="#D97706" strokeWidth="1.5" />

        {/* Flaming Torch of Learning */}
        <g transform="translate(50, 56) scale(0.9)">
          {/* Flame */}
          <path
            d="M0 -15C-4 -9 -6 -3 -3 2C0 5 4 4 4 0C5 -4 2 -11 0 -15Z"
            fill="#EF4444"
          />
          <path
            d="M0 -11C-2 -7 -3 -3 -1 0C1 2 3 2 3 0C3 -3 1 -8 0 -11Z"
            fill="#FBBF24"
          />
          {/* Torch Handle */}
          <path
            d="M-4 3H4L2 14H-2L-4 3Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="1"
          />
        </g>

        {/* Lower Banner Ribbon with Motto */}
        <path
          d="M16 80L24 74H76L84 80L80 86H20L16 80Z"
          fill="#D97706"
          stroke="#92400E"
          strokeWidth="1"
        />
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="5.5"
          fontWeight="bold"
          fontFamily="sans-serif"
          letterSpacing="0.4"
        >
          PHS • 1960
        </text>

        {/* Stars */}
        <circle cx="28" cy="50" r="2" fill="#FBBF24" />
        <circle cx="72" cy="50" r="2" fill="#FBBF24" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight text-base">
            Papine High School
          </span>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Printing & Document Centre
          </span>
        </div>
      )}
    </div>
  );
};
