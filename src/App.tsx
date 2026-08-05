import { Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Builder from '@/pages/Builder'
import AtsChecker from '@/pages/AtsChecker'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/ats-checker" element={<AtsChecker />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
