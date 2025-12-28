import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    // Primary: Octopus Blue/Cyan pop
    primary: "bg-[#00344F] text-white hover:bg-[#1FB6D5] hover:text-[#021019] shadow-lg shadow-[#00344F]/40 border border-[#1FB6D5]/20",
    // Secondary: Dark Gray
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
    // Outline: Light border
    outline: "border border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-white",
    // Ghost: Text only
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;