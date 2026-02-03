# OKMD – Construction Management Dashboard

Internal web application for **BOQ analysis, progress monitoring, and construction management**  
for the **OKMD New Building Project**.

Built with **Next.js (App Router)** and designed for real-world use by  
QS, Engineers, and Project Managers.

---

## ✨ Features

### 📦 BOQ Dashboard
- Support **multiple buildings** (NKC1, NKC2)
- Load BOQ directly from **embedded Excel files** (`/public/boq`)
- Auto-detect valid sheets by required columns
- Cascading visualization by:
  - WBS-1 → WBS-2 → WBS-3 → WBS-4 → Description
- Interactive charts (Pie / Bar) with lazy rendering for performance

---

### 🔍 BOQ Query Tool (Advanced)
Designed as a **mini BOQ calculation workspace**

- Search by **Description** (Thai / English)
- Match mode:
  - `ALL` words
  - `ANY` word
- Highlight matched keywords
- Pagination for large BOQ tables
- Exclude rows with `Amount = 0` automatically

#### 🧮 Calculation-friendly UX
- Select rows to remove (highlight only, not immediate delete)
- Toggle selection (undo-friendly)
- Apply removal in batch
- Summary:
  - **Sum Amount**
  - **Sum Qty grouped by Unit** (prevents incorrect unit mixing)

---

### 📊 Table Controls
- Column-level filtering for:
  - WBS-1
  - WBS-2
  - WBS-3
  - WBS-4
- Filter applies only to table (does not affect charts)

---

### 📤 Export
- Export current table state to:
  - **CSV**
  - **PDF**
- Export respects:
  - Search result
  - Header filters
  - Applied row removals
  - Summary values

---

## 🧠 Design Principles

- **Real construction workflow first**
- No fake aggregation (e.g. Qty with mixed units)
- Clear separation of:
  - Exploration (Charts)
  - Audit & Calculation (Query Table)
- Undo-friendly and predictable UX
- Performance-aware (lazy render, client-side staging)

---

## 🗂 Project Structure (Simplified)

