// Sanchalan router: / → marketing site, /app → dashboard.

import Dashboard from './Dashboard';
import Landing from './views/Landing';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path === '/' || path === '/index.html') {
    return <Landing />;
  }
  return <Dashboard />;
}
