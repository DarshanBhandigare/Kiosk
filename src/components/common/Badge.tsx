import React from 'react';

interface BadgeProps {
  variant?: 'critical' | 'high' | 'medium' | 'success' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md'
}) => {
  const variantStyles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
    high: 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200/80 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
