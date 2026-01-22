import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-line text-white placeholder-white/20 focus:outline-none focus:border-brand/50 focus:bg-brand/5 transition-all ${className}`}
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
    <div className="w-full">
      {label && <label className="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">{label}</label>}
      <select
        className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-line text-white focus:outline-none focus:border-brand/50 focus:bg-brand/5 transition-all appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};