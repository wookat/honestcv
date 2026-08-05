import { Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Builder from '@/pages/Builder'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
