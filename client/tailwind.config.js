/**
 * Design tokens — the single vocabulary every screen uses.
 *
 * Components never say "slate-200"; they say `border-border`, `bg-surface`,
 * `text-muted`. The actual color values live as CSS variables in index.css,
 * with a `.dark` override block. Flipping the whole app to dark mode later
 * is therefore ONE class on <html> — zero component changes. That is the
 * "dark-mode-ready architecture" required by the spec.
 *
 * `<alpha-value>` keeps Tailwind's opacity modifiers (bg-primary/10) working
 * with our variables.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)', // page background
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // cards, panels
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)', // primary text
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // secondary text
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          hover: 'rgb(var(--color-danger-hover) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
