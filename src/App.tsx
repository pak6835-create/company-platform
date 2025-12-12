import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { SharedLibraryProvider } from './context/SharedLibraryContext'

// 로딩 컴포넌트
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px',
      }} />
      <p>로딩 중...</p>
    </div>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// 레이아웃 내 페이지 - lazy loading
const Home = lazy(() => import('./pages/Home'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Contact = lazy(() => import('./pages/Contact'))
const Download = lazy(() => import('./pages/Download'))
const Blog = lazy(() => import('./pages/Blog'))
const Quote = lazy(() => import('./pages/Quote'))
const Faq = lazy(() => import('./pages/Faq'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))

// 독립 페이지 - lazy loading
const Login = lazy(() => import('./pages/Login'))
const MyPage = lazy(() => import('./pages/MyPage'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

// 워크스페이스 - 무거운 모듈이라 반드시 lazy loading
const WorkspaceDashboard = lazy(() => import('./pages/WorkspaceDashboard'))
const Workspace = lazy(() => import('./pages/Workspace'))
const StoryAI = lazy(() => import('./pages/StoryAI'))
const AIGenerator = lazy(() => import('./pages/AIGenerator'))

function App() {
  return (
    <SharedLibraryProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="contact" element={<Contact />} />
            <Route path="download" element={<Download />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:id" element={<Blog />} />
            <Route path="quote" element={<Quote />} />
            <Route path="faq" element={<Faq />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={<Admin />} />
          {/* 워크스페이스 라우트 */}
          <Route path="/workspace" element={<WorkspaceDashboard />} />
          <Route path="/workspace/ai-generator" element={<AIGenerator />} />
          <Route path="/workspace/whiteboard" element={<Workspace />} />
          <Route path="/workspace/story" element={<StoryAI />} />
          {/* 404 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SharedLibraryProvider>
  )
}

export default App
