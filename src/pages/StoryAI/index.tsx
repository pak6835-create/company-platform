import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSharedLibrary } from '../../context/SharedLibraryContext'
import SettingTab from './SettingTab'
import CharacterTab from './CharacterTab'
import SimulationTab from './SimulationTab'
import ResultTab from './ResultTab'
import './StoryAI.css'

// 프로젝트 타입
export interface StoryProject {
  id: string
  title: string
  genre: string
  keywords: string[]
  mood: string
  worldSetting?: {
    description: string
    rules: string[]
    timeline: string
  }
  plot?: {
    act1: string
    act2: string
    act3: string
  }
  characters: Character[]
  episodes: Episode[]
  createdAt: number
  updatedAt: number
}

// 캐릭터 타입
export interface Character {
  id: string
  name: string
  role: string
  age: string
  goal: string
  secret: string
  personality: {
    introvert_extrovert: number
    emotional_rational: number
    timid_bold: number
    selfish_altruistic: number
    serious_humorous: number
  }
  speechStyle: {
    formal_casual: number
    quiet_talkative: number
    habits: string[]
    examples: string[]
  }
  relationships: { [charId: string]: { type: string; level: number } }
}

// 에피소드 타입
export interface Episode {
  id: string
  number: number
  title: string
  scenes: Scene[]
  simulation?: {
    turns: SimulationTurn[]
    status: 'pending' | 'running' | 'completed'
  }
  result?: {
    summary: string
    dialogue: string[]
    storyboard: string[]
  }
}

// 씬 타입
export interface Scene {
  id: string
  location: string
  time: string
  situation: string
  participants: string[]
  events: string[]
  endCondition: string
}

// 시뮬레이션 턴 타입
export interface SimulationTurn {
  characterId: string
  characterName: string
  dialogue: string
  action: string
  emotion: string
}

type TabType = 'setting' | 'character' | 'simulation' | 'result'

// 초기 프로젝트 데이터
const createInitialProject = (): StoryProject => ({
  id: `project-${Date.now()}`,
  title: '새 프로젝트',
  genre: '',
  keywords: [],
  mood: '',
  characters: [],
  episodes: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export default function StoryAI() {
  const navigate = useNavigate()
  const { assets } = useSharedLibrary()
  const [activeTab, setActiveTab] = useState<TabType>('setting')
  const [project, setProject] = useState<StoryProject>(createInitialProject())
  const [showLibrary, setShowLibrary] = useState(false)

  // 탭 정보
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'setting', label: '설정', icon: '⚙️' },
    { id: 'character', label: '캐릭터', icon: '👥' },
    { id: 'simulation', label: '시뮬레이션', icon: '🎬' },
    { id: 'result', label: '완성본', icon: '📖' },
  ]

  // 프로젝트 업데이트
  const updateProject = (updates: Partial<StoryProject>) => {
    setProject((prev) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }))
  }

  return (
    <div className="story-ai">
      {/* 헤더 */}
      <header className="story-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/workspace')}>
            ← 대시보드
          </button>
          <h1>📚 스토리 AI</h1>
        </div>
        <div className="header-center">
          <input
            type="text"
            className="project-title-input"
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            placeholder="프로젝트 이름"
          />
        </div>
        <div className="header-right">
          <button
            className={`library-btn ${showLibrary ? 'active' : ''}`}
            onClick={() => setShowLibrary(!showLibrary)}
          >
            📚 라이브러리 ({assets.length})
          </button>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="story-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="story-content">
        {activeTab === 'setting' && (
          <SettingTab project={project} updateProject={updateProject} />
        )}
        {activeTab === 'character' && (
          <CharacterTab project={project} updateProject={updateProject} />
        )}
        {activeTab === 'simulation' && (
          <SimulationTab project={project} updateProject={updateProject} />
        )}
        {activeTab === 'result' && (
          <ResultTab project={project} />
        )}
      </main>

      {/* 공유 라이브러리 사이드바 */}
      {showLibrary && (
        <aside className="shared-library-sidebar">
          <div className="library-header">
            <h3>📚 공유 라이브러리</h3>
            <button onClick={() => setShowLibrary(false)}>✕</button>
          </div>
          <div className="library-content">
            {assets.length === 0 ? (
              <p className="empty-library">
                라이브러리가 비어있습니다.<br />
                화이트보드에서 이미지를 생성하면 여기에 저장됩니다.
              </p>
            ) : (
              <div className="library-grid">
                {assets.map((asset) => (
                  <div key={asset.id} className="library-item">
                    <img src={asset.url} alt={asset.prompt || '이미지'} />
                    {asset.prompt && (
                      <div className="library-item-prompt">{asset.prompt}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
