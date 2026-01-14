import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  trigger, 
  align = 'right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute top-full mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}>
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  return (
    <div
      className={`px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div className="h-px bg-border my-1" />;
};