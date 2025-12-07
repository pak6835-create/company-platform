import { useNavigate } from 'react-router-dom'
import './WorkspaceDashboard.css'

export default function WorkspaceDashboard() {
  const navigate = useNavigate()

  return (
    <div className="workspace-dashboard">
      <div className="dashboard-header">
        <h1>Canvas Fold</h1>
        <p>웹툰 제작을 위한 AI 워크스페이스</p>
      </div>

      <div className="dashboard-cards">
        {/* 화이트보드 카드 */}
        <div
          className="dashboard-card whiteboard-card"
          onClick={() => navigate('/workspace/whiteboard')}
        >
          <div className="card-icon">🎨</div>
          <h2>화이트보드</h2>
          <p>노드 기반 AI 이미지 생성 워크스페이스</p>
          <ul className="card-features">
            <li>AI 이미지 생성 (Gemini)</li>
            <li>포즈 변경 / 배경 제거</li>
            <li>무한 캔버스 & 노드 연결</li>
            <li>드래그앤드롭 작업</li>
          </ul>
          <div className="card-action">
            <span>시작하기 →</span>
          </div>
        </div>

        {/* 스토리 기획 카드 */}
        <div
          className="dashboard-card story-card"
          onClick={() => navigate('/workspace/story')}
        >
          <div className="card-icon">📖</div>
          <h2>스토리 기획</h2>
          <p>AI 캐릭터 시뮬레이션 기반 스토리 생성</p>
          <ul className="card-features">
            <li>세계관/캐릭터 자동 생성</li>
            <li>캐릭터 AI 대화 시뮬레이션</li>
            <li>작가 개입 & 조정</li>
            <li>스토리/콘티 자동 정리</li>
          </ul>
          <div className="card-action">
            <span>시작하기 →</span>
          </div>
        </div>
      </div>

      {/* 공유 라이브러리 안내 */}
      <div className="shared-library-info">
        <div className="info-icon">📚</div>
        <div className="info-text">
          <h3>공유 라이브러리</h3>
          <p>화이트보드와 스토리 기획에서 생성한 이미지는 공유 라이브러리에 저장되어 양쪽에서 모두 사용할 수 있습니다.</p>
        </div>
      </div>

      {/* 하단 링크 */}
      <div className="dashboard-footer">
        <button onClick={() => navigate('/')} className="back-btn">
          ← 홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
