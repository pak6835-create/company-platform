import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import ChatWidget from './ChatWidget'
import './Layout.css'

function Layout() {
  const location = useLocation()
  const { data } = useSite()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src={data.company.logo} alt={data.company.name} className="logo-img" />
            <span className="logo-text">{data.company.name}</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
              홈
            </Link>
            <Link to="/portfolio" className={`nav-link ${isActive('/portfolio') ? 'active' : ''}`}>
              포트폴리오
            </Link>
            <Link to="/workspace" className={`nav-link ${isActive('/workspace') ? 'active' : ''}`}>
              워크스페이스
            </Link>
            <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>
              블로그
            </Link>
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
              문의
            </Link>
          </div>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  )
}

export default Layout
