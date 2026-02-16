# 🚂 KAMUi Construction Dashboard

Web-based dashboard for construction project management\
Built with Next.js + Supabase

------------------------------------------------------------------------

## ✨ Features

-   📊 BOQ Upload & Analysis (Excel)
-   🧩 Cascading WBS Filter (WBS1 → WBS4)
-   📈 S-Curve (Plan vs Actual)
-   📅 Cut-off Date Reporting
-   📋 KPI Summary Dashboard
-   🎬 Media Page (Project Timelapse)
-   🔐 Authentication (Supabase)

------------------------------------------------------------------------

## 🏗 Tech Stack

-   **Frontend**: Next.js (App Router) + TypeScript\
-   **Styling**: TailwindCSS\
-   **State Management**: Zustand\
-   **Charts**: Recharts\
-   **Backend**: Supabase\
-   **Database**: PostgreSQL\
-   **Deployment**: Vercel

------------------------------------------------------------------------

## 📂 Project Structure

    app/
    _components/
    lib/
    public/
    package.json
    tsconfig.json
    next.config.js

------------------------------------------------------------------------

## 🚀 Local Development

### 1️⃣ Install dependencies

``` bash
pnpm install
```

### 2️⃣ Create environment file

Create `.env.local`

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3️⃣ Run development server

``` bash
pnpm dev
```

Open:

http://localhost:3000

------------------------------------------------------------------------

## 🌍 Deployment

Recommended: **Vercel**

1.  Push repository to GitHub\
2.  Connect project in Vercel\
3.  Add Environment Variables\
4.  Deploy

------------------------------------------------------------------------

## 📊 Core Modules

-   `/boq` → BOQ analysis
-   `/report` → Project reporting
-   `/media` → Timelapse videos
-   `/admin` → Admin tools (if enabled)

------------------------------------------------------------------------

## 🔐 Security

-   Supabase Authentication
-   Environment variables stored securely
-   Database managed via Supabase

------------------------------------------------------------------------

## 📦 Version

**v1.0**

------------------------------------------------------------------------

## 👷 Author

OKMD Construction Dashboard\
Built for internal project management
