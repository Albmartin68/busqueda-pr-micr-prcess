// FIX: Create Filters component.
import React from 'react';
import { FilterOptions, DateRange, DocumentType } from '../types';
import { DATE_RANGE_OPTIONS, DOCUMENT_TYPE_OPTIONS, COUNTRY_OPTIONS, LANGUAGE_OPTIONS } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface FiltersProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

const FilterSelect: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none bg-slate-700 border border-slate-600 rounded-md py-2 pl-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDownIcon className="w-5 h-5"/>
            </div>
        </div>
    </div>
);


const Filters: React.FC<FiltersProps> = ({ filters, setFilters }) => {
  const handleFilterChange = <K extends keyof FilterOptions>(
    filterName: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <div className="space-y-6">
      <FilterSelect 
        label="Rango de Fechas"
        value={filters.dateRange}
        onChange={e => handleFilterChange('dateRange', e.target.value as DateRange)}
        options={DATE_RANGE_OPTIONS}
      />
      <FilterSelect 
        label="Tipo de Documento"
        value={filters.documentType}
        onChange={e => handleFilterChange('documentType', e.target.value as DocumentType)}
        options={DOCUMENT_TYPE_OPTIONS}
      />
      <FilterSelect 
        label="País"
        value={filters.country}
        onChange={e => handleFilterChange('country', e.target.value)}
        options={COUNTRY_OPTIONS}
      />
      <FilterSelect 
        label="Idioma"
        value={filters.language}
        onChange={e => handleFilterChange('language', e.target.value)}
        options={LANGUAGE_OPTIONS}
      />
    </div>
  );
};

export default Filters;