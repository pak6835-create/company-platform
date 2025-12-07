import { useState } from 'react'
import type { StoryProject, Character } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
  apiKey: string
  onNext: () => void
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
  appearance: '',
  backstory: '',
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

export default function CharacterTab({ project, updateProject, apiKey, onNext }: Props) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('basic')
  const [newExample, setNewExample] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [charCount, setCharCount] = useState(3)

  const selectedChar = project.characters.find((c) => c.id === selectedCharId)

  // AI 캐릭터 자동생성
  const generateCharacters = async () => {
    if (!apiKey) {
      alert('설정 탭에서 Gemini API 키를 먼저 입력해주세요.')
      return
    }
    if (!project.worldSetting) {
      alert('먼저 설정 탭에서 세계관을 생성해주세요.')
      return
    }

    setIsGenerating(true)

    const prompt = `
당신은 웹툰/웹소설 캐릭터 전문가입니다.
다음 세계관에 맞는 캐릭터 ${charCount}명을 만들어주세요.

[세계관]
${project.worldSetting.description}
규칙: ${project.worldSetting.rules.join(', ')}
시대: ${project.worldSetting.timeline}

[플롯]
1막: ${project.plot?.act1 || ''}
2막: ${project.plot?.act2 || ''}
3막: ${project.plot?.act3 || ''}

[요구사항]
- 주인공 1명, 조력자 1명, 악역 1명 포함 (${charCount}명 중에서)
- 각 캐릭터는 서로 다른 성격과 말투를 가짐
- 캐릭터 간의 관계도 설정

다음 형식의 JSON으로만 응답해주세요:
{
  "characters": [
    {
      "name": "캐릭터 이름",
      "role": "역할 (주인공/조력자/악역/서브주인공/멘토/라이벌)",
      "age": "나이",
      "goal": "목표",
      "secret": "비밀",
      "appearance": "외모 묘사 (1-2문장)",
      "backstory": "배경 이야기 (2-3문장)",
      "personality": {
        "introvert_extrovert": 0-100,
        "emotional_rational": 0-100,
        "timid_bold": 0-100,
        "selfish_altruistic": 0-100,
        "serious_humorous": 0-100
      },
      "speechStyle": {
        "formal_casual": 0-100,
        "quiet_talkative": 0-100,
        "habits": ["습관1", "습관2"],
        "examples": ["예시 대사1", "예시 대사2"]
      }
    }
  ]
}
`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'API 오류')
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.characters && Array.isArray(parsed.characters)) {
            const newCharacters: Character[] = parsed.characters.map((c: Partial<Character>, index: number) => ({
              id: `char-${Date.now()}-${index}`,
              name: c.name || '이름 없음',
              role: c.role || '주인공',
              age: c.age || '',
              goal: c.goal || '',
              secret: c.secret || '',
              appearance: c.appearance || '',
              backstory: c.backstory || '',
              personality: c.personality || {
                introvert_extrovert: 50,
                emotional_rational: 50,
                timid_bold: 50,
                selfish_altruistic: 50,
                serious_humorous: 50,
              },
              speechStyle: c.speechStyle || {
                formal_casual: 50,
                quiet_talkative: 50,
                habits: [],
                examples: [],
              },
              relationships: {},
            }))
            updateProject({ characters: [...project.characters, ...newCharacters] })
            if (newCharacters.length > 0) {
              setSelectedCharId(newCharacters[0].id)
            }
          }
        }
      }
    } catch (error) {
      console.error('캐릭터 생성 실패:', error)
      alert(`캐릭터 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsGenerating(false)
    }
  }

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

  const canProceed = project.characters.length >= 2

  return (
    <div className="character-tab">
      {/* AI 캐릭터 생성 섹션 */}
      <div className="section ai-generate-section">
        <div className="section-header">
          <span className="icon">🤖</span>
          <h2>AI 캐릭터 자동 생성</h2>
        </div>
        <p className="section-desc">
          세계관에 맞는 캐릭터를 AI가 자동으로 생성합니다.
        </p>
        <div className="generate-controls">
          <div className="char-count-control">
            <label>생성할 캐릭터 수:</label>
            <select
              value={charCount}
              onChange={(e) => setCharCount(Number(e.target.value))}
              className="form-select small"
            >
              <option value={2}>2명</option>
              <option value={3}>3명</option>
              <option value={4}>4명</option>
              <option value={5}>5명</option>
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={generateCharacters}
            disabled={isGenerating || !project.worldSetting}
          >
            {isGenerating ? '⏳ 생성 중...' : '🎭 캐릭터 자동 생성'}
          </button>
        </div>
        {!project.worldSetting && (
          <p className="warning-text">⚠️ 먼저 설정 탭에서 세계관을 생성해주세요.</p>
        )}
      </div>

      <div className="character-layout">
        {/* 캐릭터 목록 */}
        <div className="character-list-section">
          <div className="section-header">
            <span className="icon">👥</span>
            <h2>캐릭터 목록 ({project.characters.length})</h2>
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
              <span>수동으로 추가</span>
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
                  <label>외모</label>
                  <textarea
                    className="form-textarea"
                    value={selectedChar.appearance || ''}
                    onChange={(e) =>
                      updateCharacter(selectedChar.id, { appearance: e.target.value })
                    }
                    placeholder="캐릭터의 외모를 묘사해주세요"
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>배경 이야기</label>
                  <textarea
                    className="form-textarea"
                    value={selectedChar.backstory || ''}
                    onChange={(e) =>
                      updateCharacter(selectedChar.id, { backstory: e.target.value })
                    }
                    placeholder="캐릭터의 과거와 배경을 적어주세요"
                    rows={3}
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
                  다른 캐릭터와의 관계를 설정하세요.
                </p>
                {project.characters
                  .filter((c) => c.id !== selectedChar.id)
                  .map((other) => (
                    <div key={other.id} className="relationship-item">
                      <div className="rel-char">
                        <div className="char-avatar small">{other.name.charAt(0)}</div>
                        <span>{other.name}</span>
                      </div>
                      <select
                        className="form-select small"
                        value={selectedChar.relationships[other.id]?.type || ''}
                        onChange={(e) => {
                          const newRel = { ...selectedChar.relationships }
                          if (e.target.value) {
                            newRel[other.id] = { type: e.target.value, level: 50 }
                          } else {
                            delete newRel[other.id]
                          }
                          updateCharacter(selectedChar.id, { relationships: newRel })
                        }}
                      >
                        <option value="">관계 선택...</option>
                        <option value="친구">친구</option>
                        <option value="적">적</option>
                        <option value="연인">연인</option>
                        <option value="가족">가족</option>
                        <option value="라이벌">라이벌</option>
                        <option value="스승">스승</option>
                        <option value="동료">동료</option>
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
            <p>왼쪽에서 캐릭터를 선택하거나 AI로 자동 생성하세요.</p>
          </div>
        )}
      </div>

      {/* 다음 단계 버튼 */}
      {canProceed && (
        <div className="next-step">
          <button className="btn-primary" onClick={onNext}>
            다음 단계: 시뮬레이션 →
          </button>
        </div>
      )}

      <style>{`
        .character-tab {
          height: 100%;
        }

        .ai-generate-section {
          max-width: 100%;
          margin-bottom: 24px;
        }

        .section-desc {
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .generate-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .char-count-control {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
        }

        .char-count-control .form-select {
          width: auto;
        }

        .warning-text {
          color: #f59e0b;
          font-size: 13px;
          margin-top: 12px;
        }

        .character-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          height: calc(100vh - 360px);
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

        .form-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          min-height: 60px;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #7c3aed;
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

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
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
