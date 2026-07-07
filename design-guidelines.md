# Design & Implementation Guidelines (Bishal Codes)

These guidelines outline the design system, copy style, and routing permissions for the Bishal Codes developer portfolio. All future code modifications, additions, and updates MUST strictly follow these rules to ensure the site retains a clean, professional, hand-crafted aesthetic.

---

## 1. Aesthetic Constraints (Anti-AI Template)

*   **No Flashy Colors or Accents**: Do not use bright neon colors (e.g., `#ccff00` yellow/green), neon gradients, or high-contrast background glows. Stick to the core light theme color system:
    *   **Background**: `bg-slate-50` or `bg-white`
    *   **Text**: Deep slate/charcoal colors (`text-slate-900` for headings, `text-slate-600` or `text-slate-500` for paragraph body copy)
    *   **Borders**: Thin, low-contrast gray borders (`border-slate-200` or `border-slate-100`)
*   **Standard Border Rounding**:
    *   Use `rounded-lg` (or `rounded-xl` maximum) for card components, inputs, buttons, and dashboard modules.
    *   **NEVER** use bloated curves (e.g., `rounded-[40px]` or `rounded-[45px]`).
*   **Balanced Button & Container Padding**:
    *   Keep button padding standard and compact (e.g., `px-4 py-2` or `px-5 py-2.5`).
    *   **NEVER** use oversized vertical paddings (e.g., `py-4` or `py-5` for simple buttons).
*   **No Custom Cursors**:
    *   Native browser cursor behavior must be preserved. Do not add trailing or custom cursor components to the document body.

---

## 2. UI Elements & Animations

*   **No Blinking Status Indicators**:
    *   Do not use pulsing animation classes (`animate-pulse`) for status badges, activity markers, or notification dots.
    *   Indicators (like online status or available status) must be represented with simple, static text or solid icons.
*   **No "Sparkles" or AI Icons**:
    *   Do not place Lucide `<Sparkles />` or similar sparkles icons next to categories, tag headers, or section titles.
*   **No Hover Zooms / Oversized Shadows**:
    *   Keep hover transitions simple (e.g., transition-colors or tiny transform shifts).
    *   Do not use heavy, bulky shadow effects (e.g., `premium-shadow` or large colored shadows). Use simple utility classes like `shadow-sm` or `shadow-md`.

---

## 3. Copywriting & Terminology

All copywriting must sound **human-made**, direct, humble, and professional. **Purge and forbid** any AI-sounding terms or futuristic dashboard jargon:
*   **Forbid**: "KNOWLEDGE BASE PROTOCOL", "EDITORIAL FEED", "COREHUB", "MAINFRAME LAYER", "TRANSMITTING DEPLOYMENT", "SYSTEM SEEDING", "NEURAL SYNTHESIS", "INJECTION PROCESS".
*   **Use Instead**: "Blog", "Articles", "Admin Dashboard", "Projects Registry", "Save", "System Logs", "Experience Log".

---

## 4. Routing & Access Rules

*   **Navbar & Sidebar Menus**:
    *   The link/option to access the `/admin` panel (both on desktop menus and mobile slide-out sheets) must be conditionally rendered.
    *   Only show the admin link/options if a user is logged in **and** their email matches the authorized admin list:
        *   `bishalmishra9000@gmail.com`
        *   `admin@bishalcodes.com`
        *   `developer@bishalcodes.com`
    *   Non-admin clients logged into Firebase must see only standard Client Portal options and a "Sign Out" button.
