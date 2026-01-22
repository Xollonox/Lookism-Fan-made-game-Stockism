import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "px-4 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-brand text-white shadow-[0_10px_30px_rgba(91,99,255,0.25)] hover:brightness-110 border border-transparent",
    secondary: "bg-white/5 border border-line text-white hover:bg-white/10",
    danger: "bg-bad text-white shadow-[0_10px_30px_rgba(255,77,109,0.25)] hover:brightness-110",
    success: "bg-good text-black shadow-[0_10px_30px_rgba(43,212,167,0.25)] hover:brightness-110",
    ghost: "bg-transparent border border-line text-muted hover:text-white hover:border-white/20",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};