import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'

const Builder = lazy(() => import('@/pages/Builder'))
const AtsChecker = lazy(() => import('@/pages/AtsChecker'))

function RouteFallback() {
  return (
    <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
      Loading…
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
