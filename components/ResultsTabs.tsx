
import React from 'react';
import { ActiveTab } from '../types';
import { TABS } from '../constants';

interface ResultsTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-slate-700 overflow-x-auto">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ResultsTabs;
   