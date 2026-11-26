# Pallavi's portfolio architecture

The portfolio is structured as a single React page with five sections in TSX. Each section has its own folder and component. The current scaffold renders no visible content.

## Requirements and dependencies

| Requirement | Purpose |
| --- | --- |
| Node.js and npm | Run the development tools and install dependencies from `package-lock.json`. Setup was verified with Node.js 24 and npm 11. |
| `react` and `react-dom` | Define components and render the React application in the browser. |
| `typescript`, `@types/react` and `@types/react-dom` | Type-check TSX and provide React and React DOM type declarations. |
| `vite` and `@vitejs/plugin-react` | Provide the development server, React Fast Refresh and production bundling. |
| `tailwindcss` and `@tailwindcss/vite` | Compile the Tailwind stylesheet through Vite. The entry stylesheet imports Tailwind. |
| `eslint`, `@eslint/js`, `typescript-eslint` and `globals` | Apply JavaScript and TypeScript lint rules and declare browser globals. |
| `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` | Check React hook usage and component export patterns for Fast Refresh. |

The existing manifest and lockfile specify the dependency versions. Run `npm ci` on a fresh checkout to reproduce the installation. Run `npm run build` to type-check and bundle the scaffold, and `npm run lint` to check the source.

## Source layout

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── assets/
└── sections/
    ├── Home/Home.tsx
    ├── AboutMe/AboutMe.tsx
    ├── Skills/Skills.tsx
    ├── MyWork/MyWork.tsx
    └── Contact/Contact.tsx
```

`main.tsx` mounts React and loads the global stylesheet. `App.tsx` assembles the five section components in page order. `index.css` is the global Tailwind entry point.

| Section | Responsibility when implemented |
| --- | --- |
| Home | Introduce Pallavi and her professional focus. |
| About Me | Present Pallavi's biography and background. |
| Skills | Organize technical skills and tools. |
| My Work | Present projects and their supporting details. |
| Contact | Provide ways for visitors to reach Pallavi. |

## Component boundaries

Each section exposes one entry component to `App.tsx`. Keep section-specific components, content, and types in that section's folder as they are added. Move components into `src/components/` when multiple sections need them. Place imported media in `src/assets/` and files that need a stable public URL in `public/`.

The five sections share one page. Section links can use native anchors when navigation is implemented, so the scaffold requires no routing package. UI, content, animations, and contact delivery are outside the current setup.
