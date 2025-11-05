import React from 'react';

export const ThesisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 2L3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7L12 2z" />
    <path d="M12 22V7" />
    <path d="M12 7L3 2.5" />
    <path d="M12 7l9-4.5" />
    <path d="M3 7h18" />
  </svg>
);