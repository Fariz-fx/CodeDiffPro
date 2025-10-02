
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ onClick, children, ariaLabel, disabled = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        disabled
          ? 'text-gray-600 bg-gray-800 cursor-not-allowed'
          : 'text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
};
