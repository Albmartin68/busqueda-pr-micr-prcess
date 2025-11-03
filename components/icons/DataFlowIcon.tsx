import React from 'react';

export const DataFlowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M2 13.1a5 5 0 0 0 9.8 2.55L14 13.5V11a2 2 0 1 1 4 0v2.5l2.2-2.05A5 5 0 0 0 22 8.9c0-2.76-2.24-5-5-5s-5 2.24-5 5v.5" />
    <path d="M2 13.1C2 10.29 4.24 8 7 8s5 2.29 5 5.1v.5" />
    <path d="M14 11V8c0-1.66 1.34-3 3-3s3 1.34 3 3v3" />
    <path d="M7 18a4.6 4.6 0 0 0-4.5-5H2" />
    <path d="M17 18a4.6 4.6 0 0 1 4.5-5H22" />
  </svg>
);