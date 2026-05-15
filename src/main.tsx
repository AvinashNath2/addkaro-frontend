// main.tsx — the single entry point of the entire React app
// This is the first file that runs. It mounts the React app into the
// <div id="root"> element that lives in index.html.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// BrowserRouter enables client-side navigation — clicking a link changes
// the URL in the address bar WITHOUT reloading the page (like a native app).
import { BrowserRouter } from 'react-router-dom'

// TanStack Query is our "server state" manager.
// It handles API calls: caching responses, showing loading states,
// retrying failed requests, and keeping data fresh.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// DevTools: a floating panel (only visible in development) that shows
// every query's status, cached data, and lets you manually refresh them.
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App'

// Global CSS: Tailwind base reset + our custom component classes
import './index.css'

// Create the single QueryClient instance for the whole app.
// All components share this one client — they get deduplicated requests
// and shared cache automatically.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long fetched data is considered "fresh" before refetching.
      // 5 minutes = the app won't hit the API again if you navigate away
      // and come back within 5 minutes. Saves unnecessary API calls.
      staleTime: 1000 * 60 * 5,

      // If an API request fails, retry it once before showing an error.
      // Default is 3 — we lower it to 1 to fail faster in dev.
      retry: 1,
    },
  },
})

// createRoot(element).render(...) is React 18's way of starting the app.
// It finds <div id="root"> in index.html and renders everything inside it.
createRoot(document.getElementById('root')!).render(
  // StrictMode: a development-only wrapper that intentionally double-renders
  // components to help catch bugs (side effects, stale closures, etc.).
  // Has zero effect in production builds.
  <StrictMode>
    {/* QueryClientProvider makes the queryClient available to every
        component in the tree via React context (no prop drilling needed) */}
    <QueryClientProvider client={queryClient}>

      {/* BrowserRouter watches the URL and re-renders the matching <Route>
          in App.tsx whenever the user navigates */}
      <BrowserRouter>
        <App />
      </BrowserRouter>

      {/* The query devtools panel — only shown in development */}
      <ReactQueryDevtools initialIsOpen={false} />

    </QueryClientProvider>
  </StrictMode>,
)
