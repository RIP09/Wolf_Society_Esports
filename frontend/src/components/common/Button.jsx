import React from 'react';

const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const base = 'rounded-lg font-bold transition-colors inline-flex items-center justify-center';
  const variants = {
    primary: 'bg-primary text-background hover:bg-primary/80',
    secondary: 'bg-secondary text-white hover:bg-secondary/80',
    outline: 'border border-primary text-primary hover:bg-primary/10',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
