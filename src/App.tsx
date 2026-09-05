import { Component, Suspense, lazy, useEffect, type ReactNode } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import { SiteFooter, SiteHeader } from "@/components/Layout";

const Builder = lazy(() => import("@/pages/Builder"));
const AtsChecker = lazy(() => import("@/pages/AtsChecker"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const SharedResume = lazy(() => import("@/pages/SharedResume"));

// Mirrors the static skeleton injected into spa.html (scripts/prerender.mjs)
// so slow connections see a stable form outline until the route chunk lands.
function RouteFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-6xl animate-pulse p-4"
    >
      <div className="bg-muted mb-6 h-9 w-40 rounded-md" />
      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="bg-muted h-5 w-32 rounded" />
          <div className="bg-muted h-10 rounded-md" />
          <div className="bg-muted h-10 rounded-md" />
          <div className="bg-muted h-24 rounded-md" />
          <div className="bg-muted h-5 w-32 rounded" />
          <div className="bg-muted h-10 rounded-md" />
          <div className="bg-muted h-24 rounded-md" />
        </div>
        <div className="bg-muted hidden aspect-[17/22] flex-1 rounded-md md:block" />
      </div>
    </div>
  );
}

// Route pages load as lazy chunks; if one can't be fetched (offline, flaky
// network, or a stale tab navigating after a deploy) React unmounts the tree.
// Chrome caches the failed dynamic import for the document, so a reload is
// the reliable recovery.
class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main
          id="main"
          className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center"
        >
          <div role="alert">
            <h1 className="text-lg font-semibold">This page failed to load</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Check your connection, then reload and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Reload page
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }
}

// Keeps the shell's <link rel="canonical"> and og:url pointing at the current
// route (the static index.html can only carry the homepage URL).
function CanonicalSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const canonicalPath =
      pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    const url = `https://cv.zalize.com${canonicalPath}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", url);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <CanonicalSync />
      <RouteErrorBoundary key={pathname}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/ats-checker" element={<AtsChecker />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/documents"
            element={<Dashboard section="documents" />}
          />
          <Route path="/samples" element={<Dashboard section="samples" />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/s/:id" element={<SharedResume />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RouteErrorBoundary>
    </Suspense>
  );
}
