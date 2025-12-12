import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { useTheme } from '../context/ThemeContext'
import ChatWidget from './ChatWidget'
import './Layout.css'

function Layout() {
  const location = useLocation()
  const { data } = useSite()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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
            <Link to="/faq" className={`nav-link ${isActive('/faq') ? 'active' : ''}`}>
              FAQ
            </Link>
          </div>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="테마 변경">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <Link to="/quote" className="nav-btn nav-btn-quote">
              견적 요청
            </Link>
            <Link to="/login" className="nav-btn nav-btn-login">
              로그인
            </Link>
          </div>
          {/* 모바일 햄버거 버튼 */}
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link to="/" className={`mobile-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
            홈
          </Link>
          <Link to="/portfolio" className={`mobile-link ${isActive('/portfolio') ? 'active' : ''}`}>
            포트폴리오
          </Link>
          <Link to="/workspace" className={`mobile-link ${isActive('/workspace') ? 'active' : ''}`}>
            워크스페이스
          </Link>
          <Link to="/blog" className={`mobile-link ${isActive('/blog') ? 'active' : ''}`}>
            블로그
          </Link>
          <Link to="/faq" className={`mobile-link ${isActive('/faq') ? 'active' : ''}`}>
            FAQ
          </Link>
        </div>
        <div className="mobile-menu-actions">
          <button className="mobile-theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                다크 모드
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                라이트 모드
              </>
            )}
          </button>
          <Link to="/quote" className="mobile-btn mobile-btn-quote">
            견적 요청
          </Link>
          <Link to="/login" className="mobile-btn mobile-btn-login">
            로그인
          </Link>
        </div>
      </div>
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            {/* 회사 정보 */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src={data.company.logo} alt={data.company.name} />
                <span>{data.company.name}</span>
              </Link>
              <p className="footer-desc">{data.company.tagline}</p>
              <div className="footer-social">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {/* 링크 그룹 */}
            <div className="footer-links">
              <div className="footer-link-group">
                <h4>서비스</h4>
                <Link to="/portfolio">포트폴리오</Link>
                <Link to="/workspace">워크스페이스</Link>
                <Link to="/quote">견적 요청</Link>
                <Link to="/download">다운로드</Link>
              </div>
              <div className="footer-link-group">
                <h4>고객지원</h4>
                <Link to="/faq">자주 묻는 질문</Link>
                <Link to="/contact">문의하기</Link>
                <Link to="/blog">블로그</Link>
              </div>
              <div className="footer-link-group">
                <h4>법적 고지</h4>
                <Link to="/terms">이용약관</Link>
                <Link to="/privacy">개인정보처리방침</Link>
              </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="footer-bottom">
            <div className="footer-info">
              <p>{data.company.name} | 대표: 박기호</p>
              <p>이메일: {data.contact.email} | 전화: {data.contact.phone}</p>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} {data.company.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}

export default Layout
