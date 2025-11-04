import React from 'react';

export const CodeCommitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M16 18l6-6-6-6" />
    <path d="M8 6l-6 6 6 6" />
    <line x1="6" y1="12" x2="18" y2="12" />
  </svg>
);