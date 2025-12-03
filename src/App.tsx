import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Tools from './pages/Tools'
import WebtoonAI from './tools/WebtoonAI'
import Contact from './pages/Contact'
import Download from './pages/Download'
import Blog from './pages/Blog'
import Admin from './pages/Admin'
import Workspace from './pages/Workspace'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="tools" element={<Tools />} />
        <Route path="tools/webtoon-ai" element={<WebtoonAI />} />
        <Route path="contact" element={<Contact />} />
        <Route path="download" element={<Download />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:id" element={<Blog />} />
      </Route>
      <Route path="/admin" element={<Admin />} />
      <Route path="/workspace" element={<Workspace />} />
    </Routes>
  )
}

export default App
