import React, { useEffect } from 'react';
import './christmas.css';

// Snowfall Component
export const Snowfall: React.FC = () => {
  useEffect(() => {
    const container = document.querySelector('.xmas-snowfall');
    if (!container) return;

    // Create snowflakes
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('xmas-snowflake');
      snowflake.innerHTML = '❄';
      snowflake.style.left = Math.random() * 100 + '%';
      snowflake.style.animationDuration = Math.random() * 3 + 5 + 's';
      snowflake.style.opacity = String(Math.random() * 0.6 + 0.4);
      snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';

      container.appendChild(snowflake);

      // Remove snowflake after animation
      setTimeout(() => {
        snowflake.remove();
      }, 8000);
    };

    // Create snowflakes at intervals
    const interval = setInterval(createSnowflake, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return <div className="xmas-snowfall" />;
};

// Santa Sleigh with Reindeer Component
export const SantaSleigh: React.FC = () => {
  return (
    <div className="xmas-santa-container">
      <div className="xmas-santa-sleigh-wrapper">
        {/* Reindeer team */}
        <span className="xmas-reindeer" role="img" aria-label="Reindeer">🦌</span>
        <span className="xmas-reindeer" role="img" aria-label="Reindeer">🦌</span>

        {/* Connection line */}
        <div className="xmas-connection"></div>

        {/* Sleigh with Santa sitting on it */}
        <span className="xmas-santa-sleigh" role="img" aria-label="Santa in Sleigh">
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontSize: '42px' }}>🛷</span>
            <span style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '38px'
            }}>🎅🏻</span>
          </span>
        </span>
      </div>

      {/* Snow trail effect */}
      <div className="xmas-snow-trail">
        <span>❄</span>
        <span>❄</span>
        <span>❄</span>
      </div>
    </div>
  );
};

// Christmas Tree Component
export const ChristmasTree: React.FC = () => {
  return (
    <div className="xmas-tree-container">
      <div className="xmas-tree-star">⭐</div>
      <div className="xmas-tree" role="img" aria-label="Christmas Tree">
        🎄
      </div>
      <div className="xmas-tree-lights">
        <div className="xmas-light"></div>
        <div className="xmas-light"></div>
        <div className="xmas-light"></div>
        <div className="xmas-light"></div>
        <div className="xmas-light"></div>
      </div>
    </div>
  );
};

// HOC to add snow hover effect to any component
export const withSnowHover = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    return (
      <div className="xmas-snow-hover">
        <Component {...props} />
      </div>
    );
  };
};

// Hook to add Christmas theme to sidebar items
export const useChristmasSidebar = () => {
  useEffect(() => {
    // Find all sidebar items and add Christmas class
    const sidebarItems = document.querySelectorAll('[class*="sidebar"] a, [class*="Sidebar"] a');
    sidebarItems.forEach(item => {
      item.classList.add('xmas-sidebar-item');
    });

    return () => {
      sidebarItems.forEach(item => {
        item.classList.remove('xmas-sidebar-item');
      });
    };
  }, []);
};

// Main Christmas Theme Provider
interface ChristmasThemeProps {
  children: React.ReactNode;
  enableSnowfall?: boolean;
}

export const ChristmasThemeProvider: React.FC<ChristmasThemeProps> = ({
  children,
  enableSnowfall = true
}) => {
  useChristmasSidebar();

  return (
    <>
      {enableSnowfall && <Snowfall />}
      {children}
    </>
  );
};

export default ChristmasThemeProvider;
