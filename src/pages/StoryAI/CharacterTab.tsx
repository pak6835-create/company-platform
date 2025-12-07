import { useState } from 'react'
import type { StoryProject, Character } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
}

// 역할 옵션
const ROLES = ['주인공', '조력자', '악역', '서브주인공', '멘토', '라이벌']

// 기본 캐릭터 생성
const createDefaultCharacter = (): Character => ({
  id: `char-${Date.now()}`,
  name: '새 캐릭터',
  role: '주인공',
  age: '',
  goal: '',
  secret: '',
  personality: {
    introvert_extrovert: 50,
    emotional_rational: 50,
    timid_bold: 50,
    selfish_altruistic: 50,
    serious_humorous: 50,
  },
  speechStyle: {
    formal_casual: 50,
    quiet_talkative: 50,
    habits: [],
    examples: [],
  },
  relationships: {},
})

// 성격 슬라이더 설정
const PERSONALITY_SLIDERS = [
  { key: 'introvert_extrovert', left: '내향적', right: '외향적' },
  { key: 'emotional_rational', left: '감정적', right: '이성적' },
  { key: 'timid_bold', left: '소심함', right: '대담함' },
  { key: 'selfish_altruistic', left: '이기적', right: '이타적' },
  { key: 'serious_humorous', left: '진지함', right: '유머러스' },
]

// 말투 슬라이더 설정
const SPEECH_SLIDERS = [
  { key: 'formal_casual', left: '존댓말', right: '반말' },
  { key: 'quiet_talkative', left: '말 적음', right: '말 많음' },
]

// 말투 습관 옵션
const HABIT_OPTIONS = [
  '혼잣말 많이 함',
  '욕 섞어서 말함',
  '끝에 "...했지" 붙임',
  '질문으로 대답함',
  '짧게 끊어서 말함',
  '감탄사 많이 씀',
  '비꼬는 말투',
  '장황하게 설명함',
]

type EditTab = 'basic' | 'personality' | 'speech' | 'relationship'

export default function CharacterTab({ project, updateProject }: Props) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('basic')
  const [newExample, setNewExample] = useState('')

  const selectedChar = project.characters.find((c) => c.id === selectedCharId)

  // 캐릭터 추가
  const addCharacter = () => {
    const newChar = createDefaultCharacter()
    updateProject({ characters: [...project.characters, newChar] })
    setSelectedCharId(newChar.id)
  }

  // 캐릭터 업데이트
  const updateCharacter = (charId: string, updates: Partial<Character>) => {
    updateProject({
      characters: project.characters.map((c) =>
        c.id === charId ? { ...c, ...updates } : c
      ),
    })
  }

  // 캐릭터 삭제
  const deleteCharacter = (charId: string) => {
    if (!confirm('이 캐릭터를 삭제하시겠습니까?')) return
    updateProject({
      characters: project.characters.filter((c) => c.id !== charId),
    })
    if (selectedCharId === charId) setSelectedCharId(null)
  }

  // 성격 업데이트
  const updatePersonality = (key: string, value: number) => {
    if (!selectedChar) return
    updateCharacter(selectedChar.id, {
      personality: { ...selectedChar.personality, [key]: value },
    })
  }

  // 말투 업데이트
  const updateSpeech = (key: string, value: number | string[]) => {
    if (!selectedChar) return
    updateCharacter(selectedChar.id, {
      speechStyle: { ...selectedChar.speechStyle, [key]: value },
    })
  }

  // 습관 토글
  const toggleHabit = (habit: string) => {
    if (!selectedChar) return
    const habits = selectedChar.speechStyle.habits.includes(habit)
      ? selectedChar.speechStyle.habits.filter((h) => h !== habit)
      : [...selectedChar.speechStyle.habits, habit]
    updateSpeech('habits', habits)
  }

  // 예시 대사 추가
  const addExample = () => {
    if (!selectedChar || !newExample.trim()) return
    updateSpeech('examples', [...selectedChar.speechStyle.examples, newExample.trim()])
    setNewExample('')
  }

  // 예시 대사 삭제
  const removeExample = (index: number) => {
    if (!selectedChar) return
    updateSpeech(
      'examples',
      selectedChar.speechStyle.examples.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="character-tab">
      <div className="character-layout">
        {/* 캐릭터 목록 */}
        <div className="character-list-section">
          <div className="section-header">
            <span className="icon">👥</span>
            <h2>캐릭터 목록</h2>
          </div>
          <div className="character-list">
            {project.characters.map((char) => (
              <div
                key={char.id}
                className={`character-card ${selectedCharId === char.id ? 'selected' : ''}`}
                onClick={() => setSelectedCharId(char.id)}
              >
                <div className="char-avatar">
                  {char.name.charAt(0)}
                </div>
                <div className="char-info">
                  <div className="char-name">{char.name}</div>
                  <div className="char-role">{char.role}</div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCharacter(char.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="add-character-btn" onClick={addCharacter}>
              <span>+</span>
              <span>캐릭터 추가</span>
            </button>
          </div>
        </div>

        {/* 캐릭터 편집 */}
        {selectedChar ? (
          <div className="character-editor-section">
            <div className="section-header">
              <span className="icon">✏️</span>
              <h2>캐릭터 편집: {selectedChar.name}</h2>
            </div>

            {/* 편집 탭 */}
            <div className="edit-tabs">
              {[
                { id: 'basic', label: '기본정보' },
                { id: 'personality', label: '성격' },
                { id: 'speech', label: '말투' },
                { id: 'relationship', label: '관계' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`edit-tab ${editTab === tab.id ? 'active' : ''}`}
                  onClick={() => setEditTab(tab.id as EditTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 기본정보 탭 */}
            {editTab === 'basic' && (
              <div className="edit-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>이름</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedChar.name}
                      onChange={(e) =>
                        updateCharacter(selectedChar.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>역할</label>
                    <select
                      className="form-select"
                      value={selectedChar.role}
                      onChange={(e) =>
                        updateCharacter(selectedChar.id, { role: e.target.value })
                      }
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>나이</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedChar.age}
                    onChange={(e) =>
                      updateCharacter(selectedChar.id, { age: e.target.value })
                    }
                    placeholder="예: 25세, 32→22세 (회귀)"
                  />
                </div>
                <div className="form-group">
                  <label>목표</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedChar.goal}
                    onChange={(e) =>
                      updateCharacter(selectedChar.id, { goal: e.target.value })
                    }
                    placeholder="캐릭터가 달성하고자 하는 것"
                  />
                </div>
                <div className="form-group">
                  <label>비밀</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedChar.secret}
                    onChange={(e) =>
                      updateCharacter(selectedChar.id, { secret: e.target.value })
                    }
                    placeholder="다른 캐릭터가 모르는 것"
                  />
                </div>
              </div>
            )}

            {/* 성격 탭 */}
            {editTab === 'personality' && (
              <div className="edit-content">
                <p className="tab-description">
                  슬라이더를 조절하여 캐릭터의 성격을 설정하세요.
                </p>
                {PERSONALITY_SLIDERS.map((slider) => (
                  <div key={slider.key} className="slider-group">
                    <div className="slider-labels">
                      <span>{slider.left}</span>
                      <span className="slider-value">
                        {selectedChar.personality[slider.key as keyof typeof selectedChar.personality]}%
                      </span>
                      <span>{slider.right}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedChar.personality[slider.key as keyof typeof selectedChar.personality]}
                      onChange={(e) =>
                        updatePersonality(slider.key, Number(e.target.value))
                      }
                      className="slider"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 말투 탭 */}
            {editTab === 'speech' && (
              <div className="edit-content">
                {SPEECH_SLIDERS.map((slider) => (
                  <div key={slider.key} className="slider-group">
                    <div className="slider-labels">
                      <span>{slider.left}</span>
                      <span className="slider-value">
                        {selectedChar.speechStyle[slider.key as keyof typeof selectedChar.speechStyle] as number}%
                      </span>
                      <span>{slider.right}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedChar.speechStyle[slider.key as keyof typeof selectedChar.speechStyle] as number}
                      onChange={(e) =>
                        updateSpeech(slider.key, Number(e.target.value))
                      }
                      className="slider"
                    />
                  </div>
                ))}

                <div className="form-group" style={{ marginTop: 24 }}>
                  <label>버릇/습관</label>
                  <div className="habit-options">
                    {HABIT_OPTIONS.map((habit) => (
                      <label key={habit} className="habit-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedChar.speechStyle.habits.includes(habit)}
                          onChange={() => toggleHabit(habit)}
                        />
                        <span>{habit}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>예시 대사</label>
                  <div className="example-input-row">
                    <input
                      type="text"
                      className="form-input"
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addExample()}
                      placeholder="예시 대사 입력 후 Enter"
                    />
                    <button className="btn-secondary" onClick={addExample}>
                      추가
                    </button>
                  </div>
                  {selectedChar.speechStyle.examples.length > 0 && (
                    <div className="example-list">
                      {selectedChar.speechStyle.examples.map((ex, i) => (
                        <div key={i} className="example-item">
                          <span>"{ex}"</span>
                          <button onClick={() => removeExample(i)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 관계 탭 */}
            {editTab === 'relationship' && (
              <div className="edit-content">
                <p className="tab-description">
                  다른 캐릭터와의 관계를 설정하세요. (준비 중)
                </p>
                {project.characters
                  .filter((c) => c.id !== selectedChar.id)
                  .map((other) => (
                    <div key={other.id} className="relationship-item">
                      <div className="rel-char">
                        <div className="char-avatar small">{other.name.charAt(0)}</div>
                        <span>{other.name}</span>
                      </div>
                      <select className="form-select small">
                        <option value="">관계 선택...</option>
                        <option value="친구">친구</option>
                        <option value="적">적</option>
                        <option value="연인">연인</option>
                        <option value="가족">가족</option>
                        <option value="라이벌">라이벌</option>
                        <option value="스승">스승</option>
                      </select>
                    </div>
                  ))}
                {project.characters.length < 2 && (
                  <p className="empty-message">
                    다른 캐릭터를 추가하면 관계를 설정할 수 있습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="no-selection">
            <p>왼쪽에서 캐릭터를 선택하거나 새로 추가하세요.</p>
          </div>
        )}
      </div>

      <style>{`
        .character-tab {
          height: 100%;
        }

        .character-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          height: calc(100vh - 200px);
        }

        .character-list-section,
        .character-editor-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .character-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .character-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .character-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .character-card.selected {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
        }

        .char-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .char-avatar.small {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }

        .char-info {
          flex: 1;
        }

        .char-name {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
        }

        .char-role {
          font-size: 12px;
          color: #64748b;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .character-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #ef4444;
        }

        .add-character-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: transparent;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-character-btn:hover {
          border-color: #7c3aed;
          color: #a855f7;
        }

        .edit-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .edit-tab {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-tab:hover {
          color: #94a3b8;
        }

        .edit-tab.active {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
        }

        .edit-content {
          padding: 8px 0;
        }

        .tab-description {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .slider-group {
          margin-bottom: 20px;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #94a3b8;
        }

        .slider-value {
          color: #a855f7;
          font-weight: 500;
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: #7c3aed;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .habit-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .habit-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
        }

        .habit-checkbox input {
          accent-color: #7c3aed;
        }

        .example-input-row {
          display: flex;
          gap: 8px;
        }

        .example-input-row .form-input {
          flex: 1;
        }

        .example-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .example-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 13px;
          color: #cbd5e1;
        }

        .example-item button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        .example-item button:hover {
          color: #ef4444;
        }

        .relationship-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .rel-char {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-size: 14px;
        }

        .form-select.small {
          width: 140px;
          padding: 6px 10px;
          font-size: 13px;
        }

        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 40px;
        }

        .no-selection p {
          color: #64748b;
          font-size: 14px;
        }

        .empty-message {
          color: #64748b;
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .character-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
