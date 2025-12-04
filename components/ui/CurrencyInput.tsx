import React from 'react';
import Input from './Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  name: string;
  value: number;
  onValueChange: (name: string, value: number) => void;
  prefix?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  label, name, value, onValueChange, prefix, ...props 
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get raw value, remove all non-digits
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : Number(raw);
    onValueChange(name, num);
  };

  // Format display: 1.418.000
  // If value is 0, we show empty string to allow placeholder to be visible, 
  // unless it's explicitly readOnly or specific logic requires 0. 
  // For data entry, empty is usually better than "0" when starting.
  const displayValue = value === 0 ? '' : new Intl.NumberFormat('es-AR').format(value);

  return (
    <Input
      label={label}
      name={name}
      value={displayValue}
      onChange={handleChange}
      prefix={prefix}
      type="text"
      inputMode="numeric"
      {...props}
    />
  );
};

export default CurrencyInput;