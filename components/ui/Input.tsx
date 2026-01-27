
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-[9px] font-bold text-muted mb-1.5 uppercase tracking-widest">{label}</label>}
      <input
        className={`w-full px-4 py-3 bg-bg1 border border-line text-white font-mono text-sm placeholder-muted/50 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all rounded-sm ${className}`}
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  return (
    <div className="w-full relative">
      {label && <label className="block text-[9px] font-bold text-muted mb-1.5 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        <select
          className={`w-full px-4 py-3 bg-bg1 border border-line text-white font-heading text-xs uppercase tracking-wider focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer rounded-sm ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};
