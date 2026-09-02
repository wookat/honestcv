import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'

const Builder = lazy(() => import('@/pages/Builder'))
const AtsChecker = lazy(() => import('@/pages/AtsChecker'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Jobs = lazy(() => import('@/pages/Jobs'))
const SharedResume = lazy(() => import('@/pages/SharedResume'))

// Mirrors the static skeleton injected into spa.html (scripts/prerender.mjs)
// so slow connections see a stable form outline until the route chunk lands.
function RouteFallback() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-6xl animate-pulse p-4">
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
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/ats-checker" element={<AtsChecker />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Dashboard section="documents" />} />
        <Route path="/samples" element={<Dashboard section="samples" />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/s/:id" element={<SharedResume />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
