import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Contact from './pages/Contact'
import Download from './pages/Download'
import Blog from './pages/Blog'
import Admin from './pages/Admin'
import Workspace from './pages/Workspace'
import WorkspaceDashboard from './pages/WorkspaceDashboard'
import StoryAI from './pages/StoryAI'
import { SharedLibraryProvider } from './context/SharedLibraryContext'

function App() {
  return (
    <SharedLibraryProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="contact" element={<Contact />} />
          <Route path="download" element={<Download />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<Blog />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
        {/* 워크스페이스 라우트 */}
        <Route path="/workspace" element={<WorkspaceDashboard />} />
        <Route path="/workspace/whiteboard" element={<Workspace />} />
        <Route path="/workspace/story" element={<StoryAI />} />
      </Routes>
    </SharedLibraryProvider>
  )
}

export default App
