// FIX: Create TranslateIcon component.
import React from 'react';

export const TranslateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 5h7" />
    <path d="M9 3v2c0 4.42-3.58 8-8 8" />
    <path d="M5 9c0 2.14 1.86 5 5 5" />
    <path d="M12 20l4-9 4 9" />
    <path d="M19.1 18h-6.2" />
  </svg>
);
