import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">페이지를 찾을 수 없습니다</h1>
        <p className="notfound-desc">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn primary">
            홈으로 돌아가기
          </Link>
          <Link to="/contact" className="notfound-btn secondary">
            문의하기
          </Link>
        </div>
        <div className="notfound-links">
          <p>이런 페이지는 어떠세요?</p>
          <div className="notfound-link-list">
            <Link to="/portfolio">포트폴리오</Link>
            <Link to="/faq">자주 묻는 질문</Link>
            <Link to="/quote">견적 요청</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
