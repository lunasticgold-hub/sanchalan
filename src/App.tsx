// Client-side navigation without full page reloads (preserves Supabase session).

import { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import Landing from './views/Landing';
import FeaturesPage from './views/FeaturesPage';
import PricingPage from './views/PricingPage';
import AboutPage from './views/AboutPage';
import ContactPage from './views/ContactPage';
import FaqPage from './views/FaqPage';
import PrivacyPage from './views/PrivacyPage';
import TermsPage from './views/TermsPage';
import ChangelogPage from './views/ChangelogPage';

const ROUTES: Record<string, () => JSX.Element> = {
  '/': Landing,
  '/features': FeaturesPage,
  '/pricing': PricingPage,
  '/about': AboutPage,
  '/contact': ContactPage,
  '/faq': FaqPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
  '/changelog': ChangelogPage,
};

function usePath() {
  const [path, setPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/'
  );
  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname.replace(/\/$/, '') || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export default function App() {
  const path = usePath();
  if (path.startsWith('/app')) return <Dashboard />;
  const Page = ROUTES[path];
  if (Page) return <Page />;
  return <Landing />;
}
