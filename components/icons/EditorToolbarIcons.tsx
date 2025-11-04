import React from 'react';

const IconBase: React.FC<React.SVGProps<SVGSVGElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);


export const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></IconBase>
);

export const ItalicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></IconBase>
);

export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></IconBase>
);

export const H1Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 10h4"/><path d="M19 18V6"/></IconBase>
);

export const H2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></IconBase>
);

export const H3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.5-1.5 1.5-2.5 0-4-1.5-1.5-2.5-1.5-4 0"/><path d="M17.5 17.5c1.5-1.5 1.5-2.5 0-4-1.5-1.5-2.5-1.5-4 0"/></IconBase>
);

export const ListOrderedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></IconBase>
);

export const ListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></IconBase>
);

export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></IconBase>
);

export const QuoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 7 4 8 8 8Z"></path><path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 7 4 8 8 8Z"></path></IconBase>
);

export const MessageSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></IconBase>
);