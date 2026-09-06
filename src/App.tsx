import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { SiteFooter, SiteHeader } from "@/components/Layout";

// The prerendered homepage HTML stays visible while this chunk loads
// (hydration keeps server HTML for a suspended boundary), so the landing
// page can load lazily like every other route.
const Landing = lazy(() => import("@/pages/Landing"));
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
  { failed: boolean; storageBlocked: boolean }
> {
  state = { failed: false, storageBlocked: false };
  static getDerivedStateFromError(error: unknown) {
    // Browsers throw a SecurityError DOMException from localStorage when the
    // user blocks cookies/site data; chunk-load failures are TypeErrors.
    return {
      failed: true,
      storageBlocked:
        error instanceof DOMException && error.name === "SecurityError",
    };
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
            <h1 className="text-lg font-semibold">
              {this.state.storageBlocked
                ? "Your browser is blocking site data"
                : "This page failed to load"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {this.state.storageBlocked
                ? "RezUp stores your resumes in your browser. Allow cookies and site data for cv.zalize.com in your browser settings, then reload."
                : "Check your connection, then reload and try again."}
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

// Scrolls to y once the document is tall enough for the offset (lazy route
// chunks and async content grow the page after navigation), giving up after
// the deadline or as soon as the user scrolls themselves. Returns a cleanup.
function scrollOnceTall(y: number): () => void {
  let raf = 0;
  const deadline = performance.now() + 3000;
  const cancel = () => cancelAnimationFrame(raf);
  window.addEventListener("wheel", cancel, { once: true, passive: true });
  window.addEventListener("touchstart", cancel, { once: true, passive: true });
  window.addEventListener("keydown", cancel, { once: true });
  const tick = () => {
    const fits =
      document.documentElement.scrollHeight >= y + window.innerHeight;
    if (fits) {
      window.scrollTo(0, y);
      return;
    }
    if (performance.now() < deadline) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancel();
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  };
}

const SCROLL_MAP_KEY = "honestcv.scrollByEntry";

function readScrollMap(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(SCROLL_MAP_KEY) ?? "{}",
    );
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const map: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed))
        if (typeof v === "number") map[k] = v;
      return map;
    }
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  return {};
}

// React Router (library mode) leaves window scroll management to the app:
// push navigations to a new route start at the top, while Back/Forward should
// return to where the user left each history entry. The browser's native POP
// restoration fires before lazy route chunks and async content grow the page,
// so it clamps to a too-short document — track each entry's offset by
// location.key instead and restore it once the page is tall enough. Hash
// targets scroll themselves.
function ScrollReset() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastY = useRef(0);
  const prev = useRef<{ key: string; pathname: string } | null>(null);
  useEffect(() => {
    if ("scrollRestoration" in window.history)
      window.history.scrollRestoration = "manual";
    const onScroll = () => {
      lastY.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const before = prev.current;
    prev.current = { key: location.key, pathname: location.pathname };
    if (before?.key === location.key) return;
    const map = readScrollMap();
    if (before) {
      map[before.key] = Math.round(lastY.current);
      try {
        sessionStorage.setItem(SCROLL_MAP_KEY, JSON.stringify(map));
      } catch {
        /* storage unavailable — skip */
      }
    }
    if (location.hash) return;
    if (navigationType === "POP") {
      if (!before) return; // initial load — ReloadScrollRestore owns reloads
      const y = map[location.key] ?? 0;
      if (y > 0) return scrollOnceTall(y);
      window.scrollTo(0, 0);
    } else if (!before || before.pathname !== location.pathname) {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per history entry
  }, [location.key]);
  return null;
}

// Browsers give up on native scroll restoration for reloads because the
// prerendered shell is short and the route chunk replaces the DOM after the
// restore window. Save the offset on pagehide and put the user back after a
// reload once the page is tall enough — unless they scroll first.
function ReloadScrollRestore() {
  useEffect(() => {
    const key = () => `honestcv.scroll:${window.location.pathname}`;
    const save = () => {
      try {
        sessionStorage.setItem(key(), String(Math.round(window.scrollY)));
      } catch {
        /* storage unavailable — skip */
      }
    };
    window.addEventListener("pagehide", save);
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    let stop = () => {};
    if (nav?.type === "reload" && !window.location.hash) {
      let y = 0;
      try {
        y = Number(sessionStorage.getItem(key()) ?? 0);
        sessionStorage.removeItem(key());
      } catch {
        /* storage unavailable — skip */
      }
      if (y > 0) stop = scrollOnceTall(y);
    }
    return () => {
      window.removeEventListener("pagehide", save);
      stop();
    };
  }, []);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <CanonicalSync />
      <ScrollReset />
      <ReloadScrollRestore />
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
