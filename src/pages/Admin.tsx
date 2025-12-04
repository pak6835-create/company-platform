import { useState } from 'react'
import { useSite, PortfolioItem } from '../context/SiteContext'
import './Admin.css'

type Tab = 'company' | 'hero' | 'contact' | 'portfolio'

// 타입 정의
interface CompanyData {
  name: string
  tagline: string
  description: string
  logo: string
}

interface HeroData {
  title: string
  subtitle: string
  description: string
}

interface ContactData {
  email: string
  phone: string
  kakao: string
  businessHours: { weekday: string; lunch: string; weekend: string }
}

function Admin() {
  const { data, updateCompany, updateHero, updateContact, addPortfolioItem, removePortfolioItem, updatePortfolioItem } = useSite()
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // 간단한 비밀번호 인증 (실제 배포시 서버 인증으로 교체)
  const ADMIN_PASSWORD = 'wedsam2024'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setMessage('')
    } else {
      setMessage('비밀번호가 올바르지 않습니다.')
    }
  }

  const showSaveMessage = () => {
    setMessage('저장되었습니다!')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>관리자 로그인</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
            />
            <button type="submit">로그인</button>
          </form>
          {message && <p className="error-message">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <p>ADMIN</p>
            <h1>관리자 대시보드</h1>
          </div>
          <button className="btn-logout" onClick={() => setIsAuthenticated(false)}>
            로그아웃
          </button>
        </div>
      </header>

      {message && <div className="save-message">{message}</div>}

      <div className="admin-tabs">
        <button className={`tab ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>
          회사 정보
        </button>
        <button className={`tab ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}>
          히어로 섹션
        </button>
        <button className={`tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
          연락처
        </button>
        <button className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
          포트폴리오
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'company' && (
          <CompanySection data={data.company} onUpdate={updateCompany} onSave={showSaveMessage} />
        )}
        {activeTab === 'hero' && (
          <HeroSection data={data.hero} onUpdate={updateHero} onSave={showSaveMessage} />
        )}
        {activeTab === 'contact' && (
          <ContactSection data={data.contact} onUpdate={updateContact} onSave={showSaveMessage} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioSection
            items={data.portfolio}
            onAdd={addPortfolioItem}
            onRemove={removePortfolioItem}
            onUpdate={updatePortfolioItem}
            onSave={showSaveMessage}
          />
        )}
      </div>
    </div>
  )
}

// 회사 정보 섹션
function CompanySection({ data, onUpdate, onSave }: {
  data: CompanyData
  onUpdate: (data: Partial<CompanyData>) => void
  onSave: () => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2>회사 정보</h2>

      <div className="form-group">
        <label>회사명</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>태그라인 (영문)</label>
        <input
          type="text"
          value={data.tagline}
          onChange={(e) => onUpdate({ tagline: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>설명</label>
        <input
          type="text"
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>로고 경로</label>
        <input
          type="text"
          value={data.logo}
          onChange={(e) => onUpdate({ logo: e.target.value })}
        />
        <span className="hint">예: /assets/logo/logo_light.svg</span>
      </div>

      <button type="submit" className="btn-save">저장</button>
    </form>
  )
}

// 히어로 섹션
function HeroSection({ data, onUpdate, onSave }: {
  data: HeroData
  onUpdate: (data: Partial<HeroData>) => void
  onSave: () => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2>히어로 섹션</h2>

      <div className="form-group">
        <label>메인 타이틀</label>
        <textarea
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          rows={2}
        />
        <span className="hint">줄바꿈은 \n으로 입력</span>
      </div>

      <div className="form-group">
        <label>서브타이틀 (영문)</label>
        <input
          type="text"
          value={data.subtitle}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>설명</label>
        <textarea
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
        />
      </div>

      <button type="submit" className="btn-save">저장</button>
    </form>
  )
}

// 연락처 섹션
function ContactSection({ data, onUpdate, onSave }: {
  data: ContactData
  onUpdate: (data: Partial<ContactData>) => void
  onSave: () => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2>연락처 정보</h2>

      <div className="form-group">
        <label>이메일</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>전화번호</label>
        <input
          type="text"
          value={data.phone}
          onChange={(e) => onUpdate({ phone: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>카카오톡</label>
        <input
          type="text"
          value={data.kakao}
          onChange={(e) => onUpdate({ kakao: e.target.value })}
        />
      </div>

      <h3>영업시간</h3>

      <div className="form-group">
        <label>평일</label>
        <input
          type="text"
          value={data.businessHours.weekday}
          onChange={(e) => onUpdate({ businessHours: { ...data.businessHours, weekday: e.target.value } })}
        />
      </div>

      <div className="form-group">
        <label>점심시간</label>
        <input
          type="text"
          value={data.businessHours.lunch}
          onChange={(e) => onUpdate({ businessHours: { ...data.businessHours, lunch: e.target.value } })}
        />
      </div>

      <div className="form-group">
        <label>주말/공휴일</label>
        <input
          type="text"
          value={data.businessHours.weekend}
          onChange={(e) => onUpdate({ businessHours: { ...data.businessHours, weekend: e.target.value } })}
        />
      </div>

      <button type="submit" className="btn-save">저장</button>
    </form>
  )
}

// 포트폴리오 섹션
function PortfolioSection({ items, onAdd, onRemove, onUpdate, onSave }: {
  items: PortfolioItem[]
  onAdd: (item: Omit<PortfolioItem, 'id'>) => void
  onRemove: (id: number) => void
  onUpdate: (id: number, item: Partial<PortfolioItem>) => void
  onSave: () => void
}) {
  const [newItem, setNewItem] = useState({ title: '', category: '배경', year: '2024', image: '', description: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.title || !newItem.image) return
    onAdd(newItem)
    setNewItem({ title: '', category: '배경', year: '2024', image: '', description: '' })
    onSave()
  }

  return (
    <div className="admin-form">
      <h2>포트폴리오 관리</h2>

      <form className="add-portfolio-form" onSubmit={handleAdd}>
        <h3>새 작품 추가</h3>
        <div className="form-row">
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="작품 제목"
            />
          </div>
          <div className="form-group">
            <label>카테고리</label>
            <input
              type="text"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>연도</label>
            <input
              type="text"
              value={newItem.year}
              onChange={(e) => setNewItem({ ...newItem, year: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>이미지 경로</label>
          <input
            type="text"
            value={newItem.image}
            onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
            placeholder="/assets/portfolio/image.jpg"
          />
        </div>
        <div className="form-group">
          <label>설명 (선택사항)</label>
          <textarea
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            rows={2}
          />
        </div>
        <button type="submit" className="btn-add">추가</button>
      </form>

      <div className="portfolio-list">
        <h3>작품 목록 ({items.length}개)</h3>
        {items.map(item => (
          <div key={item.id} className="portfolio-item">
            <div className="portfolio-item-preview">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="portfolio-item-info">
              {editingId === item.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                  />
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) => onUpdate(item.id, { category: e.target.value })}
                  />
                  <input
                    type="text"
                    value={item.year}
                    onChange={(e) => onUpdate(item.id, { year: e.target.value })}
                  />
                  <input
                    type="text"
                    value={item.image}
                    onChange={(e) => onUpdate(item.id, { image: e.target.value })}
                  />
                  <button onClick={() => { setEditingId(null); onSave() }}>완료</button>
                </div>
              ) : (
                <>
                  <h4>{item.title}</h4>
                  <span>{item.category} · {item.year}</span>
                </>
              )}
            </div>
            <div className="portfolio-item-actions">
              {editingId !== item.id && (
                <button className="btn-edit" onClick={() => setEditingId(item.id)}>수정</button>
              )}
              <button className="btn-delete" onClick={() => { onRemove(item.id); onSave() }}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin
