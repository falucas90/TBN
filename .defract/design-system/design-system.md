# Design System

## Overview

Vanilla CSS with CSS custom properties (no Tailwind, no CSS-in-JS). Styles are split across three global files: `src/styles/tokens.css` defines all design tokens as CSS variables, `src/styles/global.css` sets base resets and typography, and `src/styles/components.css` provides shared utility classes. Icons come from `lucide-react`. The app is a React 18 + Vite project.

## Colors

### Primary

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-teal` | `#0d9488` | Primary brand / interactive |
| `--color-primary-teal-light` | `#ccfbf1` | Primary tint / background fills |
| `--color-primary-teal-dark` | `#0f766e` | Primary hover / pressed state |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#111827` | Body text |
| `--color-text-secondary` | `#6b7280` | Muted / secondary text |

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-page` | `#f3f4f6` | Page background |
| `--color-bg-card` | `#ffffff` | Card surface |
| `--color-bg-sidebar` | `#ffffff` | Sidebar surface |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#e5e7eb` | Default border |
| `--color-border-hover` | `#d1d5db` | Border on hover |

### Semantic

| Role | Token | Value |
|------|-------|-------|
| Info background | `--color-info-bg` | `#eff6ff` |
| Info text | `--color-info-text` | `#3b82f6` |
| Warning background | `--color-warn-bg` | `#fffbeb` |
| Warning text | `--color-warn-text` | `#d97706` |
| Success background | `--color-success-bg` | `#f0fdf4` |
| Success text | `--color-success-text` | `#16a34a` |
| Danger background | `--color-danger-bg` | `#fef2f2` |
| Danger text | `--color-danger-text` | `#dc2626` |

## Typography

### Font Families

- Sans: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

### Font Size Scale

| Class | Value |
|-------|-------|
| `.text-sm` | `0.875rem` (14px) |
| base | `1rem` (16px, browser default) |
| `.text-lg` | `1.125rem` (18px) |
| `.text-xl` | `1.25rem` (20px) |

### Font Weights

| Class | Value |
|-------|-------|
| `.font-medium` | `500` |
| `.font-semibold` | `600` |
| `.font-bold` | `700` |

### Line Height

- Base body line-height: `1.5`

## Borders and Shadows

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-card` | `12px` |
| `--radius-input` | `6px` |
| `--radius-badge` | `999px` (pill) |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` |

## Components

### Organization

Components are organized into three directories under `src/components/`:

- `ui/` — Primitive UI elements: Badge, Button, Callout, Card, SegmentedControl, Slider, StatCard, StepIndicator, Toggle
- `forms/` — Form controls: CurrencyInput, FormField, PlatformCheckbox
- `layout/` — Structural components: AppLayout, Sidebar

### Component Count

15 component files across 3 directories.

## Conventions

### Styling Approach

- Framework: Vanilla CSS with CSS custom properties
- File pattern: Global stylesheets (`src/styles/`), no co-located CSS per component
- Naming: kebab-case for CSS custom properties (`--color-primary-teal`), kebab-case for utility classes (`.flex-center`, `.text-sm`)
- Components reference tokens via `var(--token-name)` in inline styles or global utility classes

### Font Loading

Inter is loaded via Google Fonts (`@import url('https://fonts.googleapis.com/...')`).
