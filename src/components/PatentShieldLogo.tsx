import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export const PatentShieldLogo: React.FC<Props> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="patentShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="50%" stopColor="#4FACFE" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <radialGradient id="patentCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Outer Shield Emblem */}
      <path
        d="M22 3L6 10V21C6 30.5 12.8 39.2 22 41.5C31.2 39.2 38 30.5 38 21V10L22 3Z"
        fill="url(#patentShieldGrad)"
        fillOpacity="0.2"
        stroke="url(#patentShieldGrad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Inner AI Quantum Circuit Core */}
      <circle cx="22" cy="22" r="7" fill="url(#patentCoreGlow)" stroke="#00F2FE" strokeWidth="1.5" />

      {/* Neural Node Connections */}
      <circle cx="22" cy="12" r="2" fill="#00F2FE" />
      <circle cx="31" cy="22" r="2" fill="#4FACFE" />
      <circle cx="22" cy="32" r="2" fill="#6366F1" />
      <circle cx="13" cy="22" r="2" fill="#00F2FE" />

      <line x1="22" y1="14" x2="22" y2="15" stroke="#00F2FE" strokeWidth="1.5" />
      <line x1="29" y1="22" x2="27" y2="22" stroke="#4FACFE" strokeWidth="1.5" />
      <line x1="22" y1="29" x2="22" y2="30" stroke="#6366F1" strokeWidth="1.5" />
      <line x1="15" y1="22" x2="17" y2="22" stroke="#00F2FE" strokeWidth="1.5" />

      {/* Legal Section § Document Overlay */}
      <path
        d="M19 19.5C19 18.1 20.3 17 22 17C23.7 17 25 18.1 25 19.5C25 20.9 23.7 22 22 22C20.3 22 19 23.1 19 24.5C19 25.9 20.3 27 22 27C23.7 27 25 25.9 25 24.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};
