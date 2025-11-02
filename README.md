# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/96f59291-380a-44fe-a052-4a3b6ac9db4e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/96f59291-380a-44fe-a052-4a3b6ac9db4e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

  ## What technologies are used for this project?

  This project is built with:

  - Vite
  - TypeScript
  - React
  - shadcn-ui
  - Tailwind CSS

## Intelligent Search (NLP + TF-IDF)

The app includes an intelligent search pipeline that tokenizes text, removes stopwords, builds TF–IDF vectors, and ranks jobs by cosine similarity with optional user-preference boosts.

- **Backend endpoint**: `api/search.ts`
  - Query params: `page`, `limit`, `search`, `location`, `source`, `preferences` (JSON string)
  - Returns: `{ jobs, pagination, stats }`
- **Frontend client**: `src/api/search.ts` (falls back to client-side TF‑IDF if backend not available)
- **Hook**: `useSmartJobs()` in `src/hooks/useJobs.ts`

### Local run

1. Install and start:
   ```bash
   npm i
   npm run dev
   ```
2. Optional: set `MONGODB_URI` in `.env` to enable `/api/search` against MongoDB (`jobnest.raw_jobs`). Without it, client fallback ranking is used.
3. Set preferences on `Preferences` page to personalize results.

### Example API calls

```bash
curl "http://localhost:5173/api/search?search=react%20developer&location=Remote&limit=20&page=1"
```

With preferences:

```bash
curl "http://localhost:5173/api/search?search=machine%20learning&preferences=%7B%22preferredCategories%22%3A%5B%22Data%20Science%20%26%20AI%22%5D%2C%22preferredLocations%22%3A%5B%22Bangalore%2C%20India%22%5D%2C%22remoteWork%22%3Atrue%7D"
