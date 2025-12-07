import { useState } from 'react'
import type { StoryProject } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
  apiKey: string
  setApiKey: (key: string) => void
  onNext: () => void
}

// 장르 옵션
const GENRES = [
  { value: 'hunter', label: '헌터물' },
  { value: 'fantasy', label: '판타지' },
  { value: 'romance', label: '로맨스' },
  { value: 'action', label: '액션' },
  { value: 'thriller', label: '스릴러' },
  { value: 'sf', label: 'SF' },
  { value: 'horror', label: '호러' },
  { value: 'comedy', label: '코미디' },
  { value: 'drama', label: '드라마' },
  { value: 'slice_of_life', label: '일상물' },
]

// 분위기 옵션
const MOODS = [
  { value: 'dark', label: '어두운' },
  { value: 'bright', label: '밝은' },
  { value: 'serious', label: '진지한' },
  { value: 'light', label: '가벼운' },
  { value: 'mysterious', label: '미스터리' },
  { value: 'tense', label: '긴장감' },
]

// 추천 키워드
const KEYWORD_SUGGESTIONS: { [genre: string]: string[] } = {
  hunter: ['회귀', '복수', '성장', '던전', '각성', '길드', '랭커'],
  fantasy: ['마법', '용사', '마왕', '이세계', '기사', '정령', '드래곤'],
  romance: ['재회', '연상연하', '오피스', '친구에서연인', '짝사랑', '계약연애'],
  action: ['복수', '격투', '추격', '조직', '암살', '생존'],
  thriller: ['연쇄살인', '미궁', '심리전', '복수', '반전', '음모'],
  sf: ['AI', '우주', '로봇', '타임슬립', '디스토피아', '가상현실'],
  horror: ['귀신', '저주', '폐가', '실종', '악몽', '괴물'],
  comedy: ['개그', '반전', '오해', '슬랩스틱', '패러디'],
  drama: ['가족', '성장', '우정', '갈등', '화해', '비밀'],
  slice_of_life: ['일상', '힐링', '성장', '우정', '취미', '직장'],
}

export default function SettingTab({ project, updateProject, apiKey, setApiKey, onNext }: Props) {
  const [newKeyword, setNewKeyword] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 키워드 추가
  const addKeyword = (keyword: string) => {
    if (keyword && !project.keywords.includes(keyword)) {
      updateProject({ keywords: [...project.keywords, keyword] })
    }
    setNewKeyword('')
  }

  // 키워드 삭제
  const removeKeyword = (keyword: string) => {
    updateProject({ keywords: project.keywords.filter((k) => k !== keyword) })
  }

  // 설정 생성 (Gemini API)
  const generateSetting = async () => {
    if (!apiKey) {
      alert('Gemini API 키를 입력해주세요.')
      return
    }
    if (!project.genre) {
      alert('장르를 선택해주세요.')
      return
    }

    setIsGenerating(true)

    const genreLabel = GENRES.find((g) => g.value === project.genre)?.label || project.genre
    const moodLabel = MOODS.find((m) => m.value === project.mood)?.label || project.mood || '자유'

    const prompt = `
당신은 웹툰/웹소설 세계관 전문가입니다.
다음 설정으로 웹툰 세계관과 플롯을 만들어주세요.

장르: ${genreLabel}
키워드: ${project.keywords.join(', ') || '없음'}
분위기: ${moodLabel}

다음 형식의 JSON으로만 응답해주세요 (다른 텍스트 없이):
{
  "worldSetting": {
    "description": "세계관 설명 (200자 내외)",
    "rules": ["규칙1", "규칙2", "규칙3"],
    "timeline": "시대 배경"
  },
  "plot": {
    "act1": "1막 요약 (도입부, 1-30화)",
    "act2": "2막 요약 (전개부, 31-70화)",
    "act3": "3막 요약 (결말부, 71-100화)"
  }
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
              temperature: 0.8,
              maxOutputTokens: 2048,
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
        // JSON 파싱 시도
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          updateProject({
            worldSetting: parsed.worldSetting,
            plot: parsed.plot,
          })
        }
      }
    } catch (error) {
      console.error('설정 생성 실패:', error)
      alert(`설정 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const suggestions = KEYWORD_SUGGESTIONS[project.genre] || []
  const canProceed = project.worldSetting && project.plot

  return (
    <div className="setting-tab">
      {/* API 키 입력 */}
      <div className="section">
        <div className="section-header">
          <span className="icon">🔑</span>
          <h2>Gemini API 설정</h2>
        </div>
        <div className="form-group">
          <label>API 키 (모든 기능에서 공유됨)</label>
          <input
            type="password"
            className="form-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Gemini API 키를 입력하세요"
          />
          <p className="form-hint">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
            에서 API 키를 발급받을 수 있습니다. 한번 입력하면 저장됩니다.
          </p>
        </div>
      </div>

      {/* 스토리 설정 */}
      <div className="section">
        <div className="section-header">
          <span className="icon">🎬</span>
          <h2>스토리 설정</h2>
        </div>

        <div className="setting-grid">
          {/* 장르 선택 */}
          <div className="form-group">
            <label>장르 *</label>
            <select
              className="form-select"
              value={project.genre}
              onChange={(e) => updateProject({ genre: e.target.value })}
            >
              <option value="">장르 선택...</option>
              {GENRES.map((genre) => (
                <option key={genre.value} value={genre.value}>
                  {genre.label}
                </option>
              ))}
            </select>
          </div>

          {/* 분위기 선택 */}
          <div className="form-group">
            <label>분위기</label>
            <select
              className="form-select"
              value={project.mood}
              onChange={(e) => updateProject({ mood: e.target.value })}
            >
              <option value="">분위기 선택...</option>
              {MOODS.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 키워드 입력 */}
        <div className="form-group">
          <label>키워드</label>
          <div className="keyword-input-row">
            <input
              type="text"
              className="form-input"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
              placeholder="키워드 입력 후 Enter"
            />
            <button
              className="btn-secondary"
              onClick={() => addKeyword(newKeyword)}
            >
              추가
            </button>
          </div>

          {/* 선택된 키워드 */}
          {project.keywords.length > 0 && (
            <div className="keyword-tags">
              {project.keywords.map((keyword) => (
                <span key={keyword} className="keyword-tag">
                  {keyword}
                  <button onClick={() => removeKeyword(keyword)}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* 추천 키워드 */}
          {suggestions.length > 0 && (
            <div className="keyword-suggestions">
              <span className="suggestion-label">추천:</span>
              {suggestions
                .filter((s) => !project.keywords.includes(s))
                .map((suggestion) => (
                  <button
                    key={suggestion}
                    className="suggestion-btn"
                    onClick={() => addKeyword(suggestion)}
                  >
                    + {suggestion}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <button
          className="btn-primary generate-btn"
          onClick={generateSetting}
          disabled={isGenerating || !apiKey || !project.genre}
        >
          {isGenerating ? '⏳ 생성 중...' : '🚀 세계관 & 플롯 생성'}
        </button>
      </div>

      {/* 생성된 세계관 */}
      {project.worldSetting && (
        <div className="section">
          <div className="section-header">
            <span className="icon">📖</span>
            <h2>생성된 세계관</h2>
          </div>
          <div className="generated-content">
            <div className="content-block">
              <h3>배경 설명</h3>
              <p>{project.worldSetting.description}</p>
            </div>
            <div className="content-block">
              <h3>세계 규칙</h3>
              <ul>
                {project.worldSetting.rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="content-block">
              <h3>시대 배경</h3>
              <p>{project.worldSetting.timeline}</p>
            </div>
          </div>
        </div>
      )}

      {/* 생성된 플롯 */}
      {project.plot && (
        <div className="section">
          <div className="section-header">
            <span className="icon">📊</span>
            <h2>생성된 플롯</h2>
          </div>
          <div className="plot-timeline">
            <div className="plot-act">
              <div className="act-number">1막</div>
              <div className="act-title">도입부</div>
              <p>{project.plot.act1}</p>
            </div>
            <div className="plot-connector">→</div>
            <div className="plot-act">
              <div className="act-number">2막</div>
              <div className="act-title">전개부</div>
              <p>{project.plot.act2}</p>
            </div>
            <div className="plot-connector">→</div>
            <div className="plot-act">
              <div className="act-number">3막</div>
              <div className="act-title">결말부</div>
              <p>{project.plot.act3}</p>
            </div>
          </div>
        </div>
      )}

      {/* 다음 단계 버튼 */}
      {canProceed && (
        <div className="next-step">
          <button className="btn-primary" onClick={onNext}>
            다음 단계: 캐릭터 생성 →
          </button>
        </div>
      )}

      <style>{`
        .setting-tab {
          max-width: 800px;
          margin: 0 auto;
        }

        .setting-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .keyword-input-row {
          display: flex;
          gap: 8px;
        }

        .keyword-input-row .form-input {
          flex: 1;
        }

        .keyword-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .keyword-tag {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .keyword-tag button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }

        .keyword-suggestions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .suggestion-label {
          font-size: 12px;
          color: #64748b;
        }

        .suggestion-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: #7c3aed;
          color: #a855f7;
        }

        .generate-btn {
          width: 100%;
          margin-top: 16px;
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }

        .form-hint a {
          color: #7c3aed;
        }

        .generated-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .content-block h3 {
          font-size: 14px;
          font-weight: 600;
          color: #a855f7;
          margin: 0 0 8px 0;
        }

        .content-block p {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
        }

        .content-block ul {
          margin: 0;
          padding-left: 20px;
        }

        .content-block li {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.8;
        }

        .plot-timeline {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .plot-act {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 16px;
        }

        .act-number {
          font-size: 12px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 4px;
        }

        .act-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
        }

        .plot-act p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .plot-connector {
          color: #64748b;
          font-size: 20px;
          padding-top: 32px;
        }

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .setting-grid {
            grid-template-columns: 1fr;
          }

          .plot-timeline {
            flex-direction: column;
          }

          .plot-connector {
            transform: rotate(90deg);
            padding: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}
