# AppNotas 📒 — Mobile-First Tactile Note-Taking PWA

A modern, highly tactile, mobile-first Progressive Web App (PWA) built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. Designed for immediate deployment on **Vercel** with full offline persistence, real-time checklist progress, tag management, and smooth touch gestures.

---

## 🌟 Key Features

### 1. Mobile-First Touch & Gesture UX
- **Thumb-Friendly Bottom Navigation**: Instant access to All Notes, Tag filtering, Archive, Settings, and a prominent Floating Action Button (FAB) to compose notes.
- **Card Touch Gestures**:
  - **Swipe Right**: Toggle Archive / Restore with spring physics and visual emerald cues.
  - **Swipe Left**: Move to Trash (or permanently delete if already in Trash) with rose cues.
  - **Drag-and-Drop Reordering**: Tactile grab handle (`⠿`) on cards allows dynamic 2D grid/list reordering of both pinned and general notes.
- **Glassmorphic Aesthetic**: Rounded cards (`rounded-3xl`), translucent backdrops (`backdrop-blur-xl`), micro-interactions on tap, and responsive scaling.

### 2. Dynamic Hybrid Note Composition
- **Interleaved Canvas Blocks**: Mix formatted text blocks and interactive checklist blocks seamlessly in a single note.
- **Real-Time Progress Tracking**: Dynamic completion calculation (`completed / total` and percentage) with an animated spring progress bar.
- **Card Themes & Visual Styles**: 8 gradient and pastel palettes, emoji icons (`📝`, `✨`, `💡`, `🎯`, `🚀`, etc.), and custom tags.
- **Pinned Workspace**: Keep high-priority notes locked at the top of your workspace.

### 3. Clean Persistence & Local Security
- **Offline-First Storage**: Primary storage powered by **IndexedDB** (`appnotas_db`) with automatic fallback to **localStorage**.
- **Service/Repository Pattern**: Data access is cleanly abstracted behind the `NoteRepository` interface:
  - `IndexedDBRepository`: Primary client storage.
  - `LocalStorageRepository`: Seamless fallback.
  - `SupabaseNoteRepository`: Ready-to-wire template for remote backends.
- **Backup & Restore**: One-click **Export to JSON** and **Import from JSON** with schema validation to prevent data loss across devices.

### 4. Full PWA Integration
- **Add to Home Screen**: Includes `manifest.json`, Web App icons (192px and 512px PNG & SVG), and theme color meta tags.
- **Service Worker (`sw.js`)**: Stale-while-revalidate asset caching for instant launch and offline access without browser URL bar interference.

---

## 🏗️ Architecture & File Structure

```
AppNotas/
├── public/
│   ├── icons/
│   │   ├── icon-192.png / icon-192.svg
│   │   └── icon-512.png / icon-512.svg
│   ├── manifest.json            # PWA manifest config
│   └── sw.js                    # Service Worker with offline caching
├── src/
│   ├── app/
│   │   ├── globals.css          # Safe-area & Tailwind utilities
│   │   ├── layout.tsx           # PWA metadata & viewport
│   │   └── page.tsx             # Master client page with dark mode
│   ├── components/
│   │   ├── BottomNav.tsx        # Thumb navigation + FAB
│   │   ├── Header.tsx           # Title, count, view mode toggle
│   │   ├── NoteCard.tsx         # Swipeable & draggable card
│   │   ├── NoteEditor.tsx       # Hybrid block editor modal
│   │   ├── NoteGrid.tsx         # Pinned & general notes layout
│   │   ├── SearchBar.tsx        # Search input + tag carousel
│   │   ├── SettingsPanel.tsx    # Appearance, Backup & Restore
│   │   └── TagManagerModal.tsx  # Dedicated tag filter & creator
│   ├── lib/
│   │   ├── storage.ts           # Repository pattern & IndexedDB
│   │   └── utils.ts             # Date formatting & progress helpers
│   ├── store/
│   │   └── useStore.ts          # Zustand state store
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (use Chrome DevTools mobile device emulation, e.g., iPhone 14 or Pixel 7, for the best tactile experience).

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🌐 Immediate Deployment to Vercel via GitHub

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `appnotas` or `notes-pwa`).
3. Leave it Public or Private and click **Create repository**.

### Step 2: Push Your Local Code to GitHub
In your terminal inside `AppNotas`:
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import the GitHub repository you just pushed.
4. Framework Preset will automatically detect **Next.js**.
5. Click **Deploy**.
6. Within ~60 seconds, your PWA will be live with a free HTTPS URL (e.g. `https://appnotas.vercel.app`)!

---

## 📱 Installing on Mobile Devices (PWA)

- **iOS Safari**: Open your Vercel URL, tap the **Share** button (`⎙`), and select **"Add to Home Screen"**.
- **Android Chrome**: Open your Vercel URL, tap the three dots menu (`⋮`), and select **"Install App"** or **"Add to Home screen"**.
The app will run in standalone fullscreen mode without any browser URL bar!
