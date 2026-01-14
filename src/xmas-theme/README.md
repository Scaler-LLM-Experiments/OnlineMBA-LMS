# Christmas & New Year Theme 🎄❄️

A standalone festive theme package for the SSB Student Portal with beautiful Christmas animations and effects.

## Features

### 1. Snowfall Animation ❄️
- Continuous falling snowflakes across the entire application
- Randomized sizes, speeds, and positions for natural effect
- Non-intrusive (pointer-events disabled)
- Automatically enabled via `ChristmasThemeProvider`

### 2. Snow Hover Effects on Logo 🏫
- Adds sparkly snow effect when hovering over the SSB logo
- Gentle glow and floating snowflakes
- Applied via `xmas-snow-hover` class

### 3. Sidebar Snow Decorations 🎨
- Spinning snowflake appears on sidebar items when hovered
- Subtle gradient overlay on hover
- Applied via `xmas-sidebar-item` class

### 4. Animated Santa on Horse 🎅🐴
- Appears next to "Welcome back" message
- Bouncing animation with sparkles
- Implemented as `<SantaSleigh />` component

### 5. Decorated Christmas Tree 🎄
- Positioned next to the theme toggle button
- Features blinking colored lights
- Twinkling star on top
- Gentle swaying animation
- Implemented as `<ChristmasTree />` component

## File Structure

```
src/xmas-theme/
├── christmas.css          # All CSS animations and effects
├── ChristmasTheme.tsx     # React components and providers
└── README.md             # This file
```

## Usage

### Quick Start

The theme is already integrated into the application. All effects are active automatically.

### Components

#### ChristmasThemeProvider
Wraps the entire app and enables snowfall:

```tsx
import { ChristmasThemeProvider } from './xmas-theme/ChristmasTheme';

<ChristmasThemeProvider enableSnowfall={true}>
  {/* Your app */}
</ChristmasThemeProvider>
```

#### SantaSleigh
Animated Santa on horse:

```tsx
import { SantaSleigh } from './xmas-theme/ChristmasTheme';

<SantaSleigh />
```

#### ChristmasTree
Decorated animated Christmas tree:

```tsx
import { ChristmasTree } from './xmas-theme/ChristmasTheme';

<ChristmasTree />
```

### CSS Classes

Apply these classes directly to HTML elements:

#### Snow Hover Effect
```tsx
<div className="xmas-snow-hover">
  {/* Content */}
</div>
```

#### Sidebar Item Effect
```tsx
<a className="xmas-sidebar-item">
  {/* Navigation item */}
</a>
```

#### Festive Glow
```tsx
<div className="xmas-glow">
  {/* Content with golden glow */}
</div>
```

## Customization

### Disable Snowfall
```tsx
<ChristmasThemeProvider enableSnowfall={false}>
  {/* App without snowfall */}
</ChristmasThemeProvider>
```

### Adjust Snowfall Density
Edit `ChristmasTheme.tsx`, line with `setInterval`:
```tsx
const interval = setInterval(createSnowflake, 200); // Lower = more snow
```

### Change Christmas Light Colors
Edit `christmas.css`, `.xmas-light` selectors to change bulb colors

### Modify Animation Speeds
All animations use CSS keyframes in `christmas.css`. Adjust `animation-duration` values.

## Performance

- Snowfall uses requestAnimationFrame for smooth 60fps
- CSS animations are GPU-accelerated
- Automatic cleanup when components unmount
- Minimal impact on application performance

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Removal Instructions

To completely remove the Christmas theme:

1. Remove imports from `App.tsx`:
```tsx
// Remove this line
import { ChristmasThemeProvider } from './xmas-theme/ChristmasTheme';
```

2. Remove wrapper from `App.tsx`:
```tsx
// Change from:
<ChristmasThemeProvider enableSnowfall={true}>
  <Toaster />
  <Router>...</Router>
</ChristmasThemeProvider>

// To:
<>
  <Toaster />
  <Router>...</Router>
</>
```

3. Remove imports from `Header.tsx`:
```tsx
// Remove this line
import { SantaSleigh, ChristmasTree } from '../../xmas-theme/ChristmasTheme';
```

4. Remove components from `Header.tsx`:
- Remove `<SantaSleigh />` from welcome message section
- Remove `<ChristmasTree />` from theme toggle section

5. Remove classes from `Sidebar.tsx`:
- Remove `xmas-snow-hover` from logo div
- Remove `xmas-sidebar-item` from NavLink

6. Optionally delete the entire `src/xmas-theme/` folder

## Credits

Created for SSB Student Portal
Version: 1.0.0
Theme: Christmas & New Year 2025 🎊
