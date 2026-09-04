import React from 'react';

interface Props {
  size?: number;
  className?: string;
  useImage?: boolean;
}

/**
 * Dynamic High-Tech PatentIntel.AI Logo Component
 * Combines 3D glassmorphic image rendering with clean SVG vector fallback & neon glow effects.
 */
export const PatentIntelLogo: React.FC<Props> = ({ size = 38, className = '', useImage = true }) => {
  const [imgError, setImgError] = React.useState(false);

  if (useImage && !imgError) {
    return (
      <div 
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.28)}px`,
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%)',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.35)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <img
          src="/patentintel_logo.png"
          alt="PatentIntel.AI"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: `${Math.round(size * 0.25)}px`
          }}
        />
      </div>
    );
  }

  // Pure SVG Glassmorphic Shield & AI Core Logo (100% Vector Crisp & Blends with any background)
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.28)}px`,
        background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #6366F1 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 22px rgba(0, 242, 254, 0.45)',
        flexShrink: 0
      }}
    >
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Shield Path */}
        <path
          d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
          fill="url(#logo_grad)"
          stroke="#0B0F19"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner Patent Circuit Lines */}
        <path
          d="M12 6V11M12 11L9 14M12 11L15 14"
          stroke="#0B0F19"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="6" r="1.5" fill="#0B0F19" />
        <circle cx="9" cy="14" r="1.5" fill="#0B0F19" />
        <circle cx="15" cy="14" r="1.5" fill="#0B0F19" />
        <path
          d="M8 17H16"
          stroke="#0B0F19"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="logo_grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00F2FE" />
            <stop offset="0.5" stopColor="#4FACFE" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
