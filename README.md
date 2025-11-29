# Xiao Mantou Games

A React frontend project deployed to GitHub Pages using GitHub Actions.

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Build

```bash
npm run build
```

The static site will be generated in the `dist/` folder.

## Deployment

Push to the `main` branch and GitHub Actions will automatically build and deploy to GitHub Pages.

## Configuration

- **Base URL**: `/xiao-mantou-games/` (configured in `vite.config.js`)
- **Deployment**: GitHub Pages via GitHub Actions
- **Source**: Built from `dist/` folder
