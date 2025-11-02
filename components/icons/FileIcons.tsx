import React from 'react';

// Common base for file-like icons
const FileIconBase: React.FC<React.SVGProps<SVGSVGElement> & { children?: React.ReactNode }> = ({ children, ...props }) => (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        {children}
    </svg>
);

// Generic Document Icon (PDF)
export const DocIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <FileIconBase {...props}>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </FileIconBase>
);

// Word Document Icon (W)
export const DocxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <FileIconBase {...props}>
        <polyline points="8 12 10 18 12 12 14 18 16 12" />
    </FileIconBase>
);

// Excel Document Icon (X)
export const XlsxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <FileIconBase {...props}>
        <line x1="10" y1="17" x2="14" y2="12" />
        <line x1="10" y1="12" x2="14" y2="17" />
    </FileIconBase>
);

// PowerPoint Document Icon (P)
export const PptxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <FileIconBase {...props}>
        <path d="M10 12h2a2 2 0 1 1 0 4h-2v-4Z"/>
    </FileIconBase>
);