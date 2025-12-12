import { useState } from 'react'
import { Link } from 'react-router-dom'
import './MyPage.css'

// 더미 유저 데이터
const MOCK_USER = {
  name: '홍길동',
  email: 'user@example.com',
  avatar: null,
  joinDate: '2024-06-15',
  plan: 'Pro',
}

// 더미 프로젝트 데이터
const MOCK_PROJECTS = [
  { id: 1, title: '웹툰 배경 프로젝트 A', status: '진행중', date: '2024-12-01', progress: 60 },
  { id: 2, title: '게임 컨셉아트', status: '완료', date: '2024-11-20', progress: 100 },
  { id: 3, title: '애니메이션 배경', status: '검토중', date: '2024-11-15', progress: 85 },
]

// 메뉴 탭
const TABS = [
  { id: 'overview', name: '대시보드', icon: '📊' },
  { id: 'projects', name: '내 프로젝트', icon: '📁' },
  { id: 'settings', name: '계정 설정', icon: '⚙️' },
]

function MyPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(MOCK_USER)

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    alert('프로필이 업데이트되었습니다. (데모)')
  }

  return (
    <div className="mypage">
      <div className="mypage-container">
        {/* 사이드바 */}
        <aside className="mypage-sidebar">
          <div className="mypage-profile">
            <div className="mypage-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <h3 className="mypage-name">{user.name}</h3>
            <p className="mypage-email">{user.email}</p>
            <span className="mypage-plan">{user.plan} 플랜</span>
          </div>

          <nav className="mypage-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`mypage-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mypage-nav-icon">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>

          <button className="mypage-logout">로그아웃</button>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="mypage-content">
          {activeTab === 'overview' && (
            <div className="mypage-section">
              <h2>대시보드</h2>

              {/* 통계 카드 */}
              <div className="mypage-stats">
                <div className="stat-card">
                  <span className="stat-icon">📁</span>
                  <div className="stat-info">
                    <span className="stat-value">3</span>
                    <span className="stat-label">총 프로젝트</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">⏳</span>
                  <div className="stat-info">
                    <span className="stat-value">1</span>
                    <span className="stat-label">진행중</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">✅</span>
                  <div className="stat-info">
                    <span className="stat-value">1</span>
                    <span className="stat-label">완료</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔔</span>
                  <div className="stat-info">
                    <span className="stat-value">2</span>
                    <span className="stat-label">알림</span>
                  </div>
                </div>
              </div>

              {/* 최근 프로젝트 */}
              <div className="mypage-recent">
                <div className="mypage-recent-header">
                  <h3>최근 프로젝트</h3>
                  <button onClick={() => setActiveTab('projects')}>전체보기</button>
                </div>
                <div className="project-list">
                  {MOCK_PROJECTS.slice(0, 3).map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-info">
                        <h4>{project.title}</h4>
                        <p>{project.date}</p>
                      </div>
                      <div className="project-status">
                        <span className={`status-badge ${project.status === '완료' ? 'completed' : project.status === '진행중' ? 'active' : 'pending'}`}>
                          {project.status}
                        </span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 빠른 액션 */}
              <div className="mypage-actions">
                <h3>빠른 액션</h3>
                <div className="action-buttons">
                  <Link to="/quote" className="action-btn">
                    <span>📝</span>
                    새 견적 요청
                  </Link>
                  <Link to="/workspace" className="action-btn">
                    <span>🎨</span>
                    워크스페이스
                  </Link>
                  <Link to="/contact" className="action-btn">
                    <span>💬</span>
                    문의하기
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="mypage-section">
              <div className="section-header">
                <h2>내 프로젝트</h2>
                <Link to="/quote" className="new-project-btn">+ 새 프로젝트</Link>
              </div>

              <div className="projects-grid">
                {MOCK_PROJECTS.map(project => (
                  <div key={project.id} className="project-card-full">
                    <div className="project-card-header">
                      <h4>{project.title}</h4>
                      <span className={`status-badge ${project.status === '완료' ? 'completed' : project.status === '진행중' ? 'active' : 'pending'}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-card-body">
                      <p>시작일: {project.date}</p>
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>진행률</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="project-card-footer">
                      <button className="project-btn">상세보기</button>
                      <button className="project-btn secondary">파일 다운로드</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mypage-section">
              <h2>계정 설정</h2>

              <form className="settings-form" onSubmit={handleProfileUpdate}>
                <div className="settings-group">
                  <h3>프로필 정보</h3>
                  <div className="form-row">
                    <div className="form-field">
                      <label>이름</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                      />
                    </div>
                    <div className="form-field">
                      <label>이메일</label>
                      <input
                        type="email"
                        value={user.email}
                        onChange={(e) => setUser({...user, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>비밀번호 변경</h3>
                  <div className="form-row">
                    <div className="form-field">
                      <label>현재 비밀번호</label>
                      <input type="password" placeholder="현재 비밀번호" />
                    </div>
                    <div className="form-field">
                      <label>새 비밀번호</label>
                      <input type="password" placeholder="새 비밀번호" />
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>알림 설정</h3>
                  <div className="toggle-list">
                    <label className="toggle-item">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-label">이메일 알림</span>
                    </label>
                    <label className="toggle-item">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-label">프로젝트 업데이트 알림</span>
                    </label>
                    <label className="toggle-item">
                      <input type="checkbox" />
                      <span className="toggle-label">마케팅 이메일 수신</span>
                    </label>
                  </div>
                </div>

                <div className="settings-actions">
                  <button type="submit" className="save-btn">변경사항 저장</button>
                </div>
              </form>

              <div className="danger-zone">
                <h3>위험 구역</h3>
                <p>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
                <button className="delete-account-btn">계정 삭제</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MyPage
