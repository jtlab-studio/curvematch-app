import React from 'react';
import clsx from 'clsx';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'light';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'medium',
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };

  const variantClasses = {
    default: 'bg-white/20 dark:bg-[#1e1e1e]/40',
    dark: 'bg-black/20 dark:bg-black/40',
    light: 'bg-white/30 dark:bg-white/10',
  };

  return (
    <div
      className={clsx(
        'backdrop-blur-md rounded-2xl border border-white/20 shadow-lg',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
