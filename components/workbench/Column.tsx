import React from 'react';

interface ColumnProps {
    width: string;
    children: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({ width, children }) => {
    return (
        <div style={{ width }} className="flex flex-col h-full bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
            {children}
        </div>
    );
};
