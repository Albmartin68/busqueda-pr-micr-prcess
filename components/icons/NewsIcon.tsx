import React from 'react';

export const NewsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"></path>
    <path d="M16 2v20"></path>
    <path d="M12 7h4"></path><path d="M12 12h4"></path>
    <path d="M12 17h4"></path>
    <path d="M8 7h0"></path><path d="M8 12h0"></path><path d="M8 17h0"></path>
  </svg>
);