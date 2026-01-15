# Automatic Routing System

This project uses a highly automated routing system built on top of TanStack Router. The goal is to minimize boilerplate and enforce strict naming conventions for a clean, predictable codebase.

## 🚀 How it Works

### 1. Zero-Touch Routing
You **never** need to manually edit a central routes file.
- The router automatically scans `src/client/pages`.
- It recursively finds all valid page files.
- It automatically registers them in the application route tree.

### 2. Auto-Generation
A background watcher script runs when you start the dev server (`bun dev`).
- **Trigger:** Create a new **empty file** in `src/client/pages`.
- **Action:** The script instantly populates the file with the necessary boilerplate code.
- **Result:** You have a working page in milliseconds.

## 📏 Strict Naming Convention
To ensure consistency, the system enforces **Strict PascalCase**.

### File Naming
- Files **MUST** start with an Uppercase letter.
- Files **MUST** end with `Route.tsx`.
- Files **MUST NOT** contain dashes `-`, underscores `_`, or spaces.
- **Valid:** `UserDashboardRoute.tsx`, `SettingsRoute.tsx`
- **Invalid:** `userDashboard.tsx`, `user-dashboard-route.tsx`

### Variable Naming
The generated code (and the router's registration logic) follows the same rule:
- Exported constant **MUST** match the filename (e.g., `UserDashboardRoute`).
- Component function **MUST** match the filename + Component (e.g., `UserDashboardRouteComponent`).

## 🛠️ Usage Guide

### Creating a New Page
1.  Run the dev server:
    ```bash
    bun dev
    ```
2.  Create a new empty file:
    ```bash
    touch src/client/pages/AnalyticsRoute.tsx
    ```
3.  **That's it!**
    The file will automatically fill with:
    ```tsx
    import { PageRoute } from '@/routers'

    export const AnalyticsRoute = PageRoute({
        path: '/analytics', // Derived from folder/filename
        component: AnalyticsRouteComponent,
        title: 'Analytics',
    })

    function AnalyticsRouteComponent() {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold">AnalyticsRoute</h1>
            </div>
        )
    }
    ```
    Your page is now live at `http://localhost:3000/analytics`.

### Nested Routes
Folder structure determines the URL path:
- File: `src/client/pages/dashboard/SettingsRoute.tsx`
- Path: `/dashboard/settings`

## ⚙️ How to Modify
- **Registrar:** `routers/routes.tsx` (Controls how files are loaded)
- **Generator:** `scripts/watchRoute.ts` (Controls how boilerplate is written)
