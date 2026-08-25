# V4 Architecture Prototype (`v4-prototype`)

This is a self-contained prototype demonstrating the **v4** architecture for
`web-audio-samples` based on **Astro SSG** and **Tailwind CSS v4**.

---

## Features Demonstrated

1. **Astro SSG Engine**:
   - Zero-JS static HTML generation by default.
   - Ultra-fast page loads and modern developer ergonomics.
2. **Tailwind CSS v4**:
   - Uses `@tailwindcss/vite` without separate external CLI watchers or
     `npm-run-all`.
3. **Interactive Web Audio Hello World**:
   - Client-side vanilla Web Audio component (`AudioDemo.astro`) running
     real-time audio synthesis with smooth gain envelope and parameter control.
4. **Autonomous & Self-Contained**:
   - Independent `package.json`, dependencies, and build pipeline that runs
     without interfering with the legacy v3 root build.

---

## Getting Started

From the repository root:

```bash
cd v4-prototype
npm install
npm run dev
```

The local development server will start at `http://localhost:4321`.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local Astro development server with HMR |
| `npm run build` | Build static production site to `dist/` |
| `npm run preview` | Locally preview production build |
