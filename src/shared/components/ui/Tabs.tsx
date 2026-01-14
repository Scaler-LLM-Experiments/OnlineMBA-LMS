/**
 * Tabs Component
 * Online MBA - Tab navigation with animated indicator
 */

import React, { memo, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  /** Tab items */
  tabs: Tab[];
  /** Active tab ID */
  activeTab?: string;
  /** Tab change handler */
  onChange?: (tabId: string) => void;
  /** Tab content by ID */
  children?: ReactNode;
  /** Variant style */
  variant?: 'default' | 'pills' | 'underline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width tabs */
  fullWidth?: boolean;
  /** Custom class name */
  className?: string;
}

export interface TabPanelProps {
  /** Tab ID this panel belongs to */
  tabId: string;
  /** Panel content */
  children: ReactNode;
  /** Custom class name */
  className?: string;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// ============================================
// Tabs Component
// ============================================

export const Tabs = memo(function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (onChange) {
        onChange(tabId);
      } else {
        setInternalActiveTab(tabId);
      }
    },
    [onChange]
  );

  // Update indicator position
  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab);
    if (activeButton && variant === 'underline') {
      const containerRect = tabsRef.current?.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      if (containerRect) {
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [activeTab, variant]);

  // Find active panel content
  const activePanel = React.Children.toArray(children).find(
    (child) =>
      React.isValidElement(child) &&
      (child as React.ReactElement<TabPanelProps>).props.tabId === activeTab
  );

  return (
    <div className={className}>
      {/* Tab List */}
      <div
        ref={tabsRef}
        role="tablist"
        className={cn(
          'relative flex',
          variant === 'default' && 'gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl',
          variant === 'pills' && 'gap-2',
          variant === 'underline' && 'border-b border-neutral-200 dark:border-neutral-800',
          fullWidth && 'w-full'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative flex items-center justify-center gap-2 font-medium transition-all duration-200',
                sizeStyles[size],
                fullWidth && 'flex-1',
                tab.disabled && 'opacity-50 cursor-not-allowed',

                // Default variant
                variant === 'default' && [
                  'rounded-lg',
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
                ],

                // Pills variant
                variant === 'pills' && [
                  'rounded-full',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                ],

                // Underline variant
                variant === 'underline' && [
                  'border-b-2 -mb-px',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
                ]
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full',
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Animated underline indicator */}
        {variant === 'underline' && (
          <div
            className="absolute bottom-0 h-0.5 bg-primary-500 transition-all duration-200"
            style={indicatorStyle}
          />
        )}
      </div>

      {/* Tab Panel */}
      {activePanel && (
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="mt-4"
        >
          {activePanel}
        </div>
      )}
    </div>
  );
});

// ============================================
// Tab Panel Component
// ============================================

export const TabPanel = memo(function TabPanel({
  children,
  className,
}: TabPanelProps) {
  return <div className={cn('animate-fade-in', className)}>{children}</div>;
});

export default Tabs;
