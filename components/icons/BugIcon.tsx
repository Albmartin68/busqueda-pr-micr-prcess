import React from 'react';

export const BugIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M20 8s-1.5-2-5-2-5 2-5 2" />
    <path d="M9 10v1" />
    <path d="M15 10v1" />
    <path d="m13.5 14-.5-1-.5 1" />
    <path d="M10 18v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4" />
    <path d="M4 12a8 8 0 0 0 16 0" />
    <path d="M4 12h16" />
    <path d="M4.5 16h15" />
  </svg>
);