# shadcn/ui Setup for BatchVideo Monorepo

## Overview

This monorepo uses shadcn/ui for shared UI components in `packages/ui`. The setup is configured to work across both web and desktop apps.

## Current Configuration

**Location:** `packages/shared`
**Package Name:** `@workspace/shared`

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@workspace/shared/components",
    "utils": "@workspace/shared/lib/utils",
    "hooks": "@workspace/shared/hooks",
    "lib": "@workspace/shared/lib",
    "ui": "@workspace/shared/components/ui"
  }
}
```

### Key Settings

- **Style:** `new-york` (modern shadcn design system)
- **Base Color:** `slate`
- **CSS Variables:** Enabled for theming
- **Icon Library:** `lucide-react`
- **React Server Components:** Disabled (client-side rendering)

## Adding New Components

### Step 1: Navigate to packages/ui

```bash
cd packages/ui
```

### Step 2: Add Component

```bash
pnpm dlx shadcn@latest add <component-name>
```

**Examples:**

```bash
# Single component
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add select

# Multiple components
pnpm dlx shadcn@latest add button card dialog

# All components (use sparingly)
pnpm dlx shadcn@latest add --all
```

### Step 3: Export from Package (if needed)

Components are auto-exported via package.json exports:

```json
{
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./lib/*": "./src/lib/*.ts",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```

## Currently Installed Components

| Component    | File                                  | Description                  |
| ------------ | ------------------------------------- | ---------------------------- |
| Button       | `src/components/ui/button.tsx`        | Primary button with variants |
| Switch       | `src/components/ui/switch.tsx`        | Toggle switch                |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Full dropdown menu system    |
| Label        | `src/components/ui/label.tsx`         | Form labels                  |

## Using Components in Apps

### In apps/web or apps/desktop

```tsx
// Import from workspace package
import { Button } from '@workspace/shared/components/ui/button';
import { Switch } from '@workspace/shared/components/ui/switch';
import { cn } from '@workspace/shared/lib/utils';

// Import global styles in your main CSS
@import '@workspace/shared/globals.css';
```

### TypeScript Path Resolution

Apps should have this in their `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@workspace/shared/*": ["../../packages/ui/src/*"]
    }
  }
}
```

## Dependencies

Core dependencies managed in `packages/ui/package.json`:

```json
{
  "dependencies": {
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "tailwind-merge": "^3.3.1",
    "tw-animate-css": "^1.3.6"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

## Utility Function

The `cn()` utility in `src/lib/utils.ts` merges Tailwind classes safely:

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Theming

CSS variables are defined in `src/styles/globals.css`. To customize:

1. Edit the CSS variables in `globals.css`
2. Or override in app-specific CSS files

## Common Commands

```bash
# List available components
pnpm dlx shadcn@latest add --help

# Add with specific registry
pnpm dlx shadcn@latest add button --registry=https://ui.shadcn.com

# View component source before adding
pnpm dlx shadcn@latest diff button
```

## Troubleshooting

### Component not found after adding

1. Check the component was created in `packages/ui/src/components/ui/`
2. Verify exports in `package.json`
3. Run `pnpm install` from root to update workspace links

### Import resolution issues

1. Check TypeScript paths in both the package and consuming app
2. Ensure the app depends on `@workspace/shared: workspace:*`
3. Run `pnpm typecheck` to verify

### Styling not applied

1. Ensure `@workspace/shared/globals.css` is imported
2. Check Tailwind config includes the package paths
3. Verify CSS variables are properly defined
