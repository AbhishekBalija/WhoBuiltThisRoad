import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { RoadProfile } from './pages/RoadProfile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/road/:slug" element={<RoadProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
