import React from 'react';

export const IeeeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="16" x2="12" y2="16" />
    <path d="M10 3v18" />
  </svg>
);