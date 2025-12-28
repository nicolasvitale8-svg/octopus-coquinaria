import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ label, prefix, helperText, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400 sm:text-sm font-bold font-mono">{prefix}</span>
          </div>
        )}
        <input
          className={`bg-[#00344F]/40 border border-slate-600 text-white text-sm rounded-md focus:ring-[#1FB6D5] focus:border-[#1FB6D5] block w-full p-2.5 placeholder-slate-500 transition-colors ${prefix ? 'pl-8' : ''} ${className}`}
          {...props}
        />
      </div>
      {helperText && (
        <p className="mt-1.5 text-xs text-slate-500 italic leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;