
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  // Premium base styles with glass/matte feel
  const baseStyles = "relative px-6 py-2.5 font-heading text-xs tracking-[0.15em] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 clip-corner uppercase font-bold overflow-hidden group active:scale-[0.97] ease-[cubic-bezier(0.22,1,0.36,1)]";
  
  const variants = {
    primary: "bg-brand text-white border-none shadow-[0_4px_15px_rgba(225,29,72,0.3)] hover:shadow-[0_8px_25px_rgba(225,29,72,0.5)] hover:-translate-y-[2px] active:translate-y-0",
    secondary: "bg-white/5 backdrop-blur-sm text-white border border-line hover:bg-white hover:text-black hover:border-transparent shadow-lg",
    danger: "bg-bad/10 backdrop-blur-sm border border-bad/30 text-bad hover:bg-bad hover:text-white shadow-sm",
    success: "bg-good text-black font-black hover:bg-white transition-colors shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-[2px]",
    ghost: "bg-transparent text-muted hover:text-white border border-transparent hover:border-line tracking-widest px-4",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
      
      {/* Decorative Shimmer / Hover Highlight - Subtler */}
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Technical corner accents - Glassy lines */}
      {variant !== 'ghost' && (
        <>
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/30" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/30" />
        </>
      )}
    </button>
  );
};
