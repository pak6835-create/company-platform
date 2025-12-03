import './Download.css'

function Download() {
  return (
    <div className="download-page">
      <header className="download-header">
        <p>DOWNLOAD</p>
        <h1>Canvas Fold</h1>
        <span className="download-description">화이트보드 스타일의 파일 탐색기 & 워크플로우 관리 앱</span>
      </header>

      <div className="download-content">
        <div className="app-preview">
          <div className="preview-placeholder">
            <span>앱 스크린샷</span>
          </div>
        </div>

        <div className="app-info">
          <div className="info-section">
            <h3>DESKTOP APP</h3>
            <h2>데스크톱 앱</h2>
            <p>파일 정리, 프로젝트 관리, 작업 기록을 화이트보드 위에서</p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>폴더 연결 및 시각화</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>노드 기반 워크플로우</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>작업 기록 추적</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>오프라인 사용 가능</span>
            </div>
          </div>

          <div className="download-buttons">
            <button className="download-btn" disabled>
              <span className="btn-text">Windows 다운로드</span>
              <span className="btn-status">준비 중</span>
            </button>
            <button className="download-btn" disabled>
              <span className="btn-text">macOS 다운로드</span>
              <span className="btn-status">준비 중</span>
            </button>
          </div>

          <p className="version-info">버전 0.1.0 · 개발 중</p>
        </div>
      </div>
    </div>
  )
}

export default Download
