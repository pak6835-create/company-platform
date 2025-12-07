import { useState } from 'react'
import type { StoryProject, Episode } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
  apiKey: string
}

type ViewTab = 'summary' | 'dialogue' | 'storyboard'

export default function ResultTab({ project, updateProject, apiKey }: Props) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    project.episodes[0]?.id || null
  )
  const [viewTab, setViewTab] = useState<ViewTab>('summary')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationType, setGenerationType] = useState<'summary' | 'storyboard' | null>(null)

  const selectedEpisode = project.episodes.find((e) => e.id === selectedEpisodeId)

  // 에피소드 결과 업데이트
  const updateEpisodeResult = (episodeId: string, result: Partial<Episode['result']>) => {
    const updatedEpisodes = project.episodes.map((ep) => {
      if (ep.id === episodeId) {
        return {
          ...ep,
          result: {
            summary: ep.result?.summary || '',
            dialogue: ep.result?.dialogue || [],
            storyboard: ep.result?.storyboard || [],
            ...result,
          },
        }
      }
      return ep
    })
    updateProject({ episodes: updatedEpisodes })
  }

  // AI 요약 생성
  const generateSummary = async () => {
    if (!apiKey || !selectedEpisode?.simulation?.turns) return

    setIsGenerating(true)
    setGenerationType('summary')

    const turns = selectedEpisode.simulation.turns
    const dialogueText = turns
      .map((t) => `${t.characterName}: "${t.dialogue}" ${t.action ? `(${t.action})` : ''}`)
      .join('\n')

    const prompt = `
당신은 웹툰/웹소설 요약 전문가입니다.
다음 캐릭터 대화를 바탕으로 에피소드 요약을 작성해주세요.

[세계관]
${project.worldSetting?.description || '정보 없음'}

[등장인물]
${project.characters.map((c) => `- ${c.name} (${c.role})`).join('\n')}

[대화 내용]
${dialogueText}

다음 형식의 JSON으로만 응답해주세요:
{
  "summary": "에피소드 요약 (200-300자, 감정과 분위기를 담아서)"
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
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      )

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          updateEpisodeResult(selectedEpisode.id, { summary: parsed.summary })
        }
      }
    } catch (error) {
      console.error('요약 생성 실패:', error)
      alert('요약 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
      setGenerationType(null)
    }
  }

  // AI 콘티 생성
  const generateStoryboard = async () => {
    if (!apiKey || !selectedEpisode?.simulation?.turns) return

    setIsGenerating(true)
    setGenerationType('storyboard')

    const turns = selectedEpisode.simulation.turns
    const dialogueText = turns
      .map((t) => `${t.characterName}: "${t.dialogue}" ${t.action ? `(${t.action})` : ''} [감정: ${t.emotion}]`)
      .join('\n')

    const prompt = `
당신은 웹툰 콘티 전문가입니다.
다음 대화와 액션을 바탕으로 웹툰 콘티를 제안해주세요.

[장르]
${project.genre}

[분위기]
${project.mood || '자유'}

[등장인물]
${project.characters.map((c) => `- ${c.name}: ${c.appearance || '외모 미정'}`).join('\n')}

[씬 정보]
${selectedEpisode.scenes?.map((s) => `- 장소: ${s.location}, 시간: ${s.time}`).join('\n') || '정보 없음'}

[대화/액션]
${dialogueText}

웹툰 형식에 맞게 8-12개의 컷(씬)으로 나눠주세요.
각 컷에는 샷 타입(와이드, 미디엄, 클로즈업 등)과 간단한 연출 설명을 포함해주세요.

다음 형식의 JSON으로만 응답해주세요:
{
  "storyboard": [
    "컷1: (와이드샷) 배경 전경, OO가 등장하는 장면",
    "컷2: (미디엄샷) OO의 표정과 대사",
    ...
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
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
          }),
        }
      )

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          updateEpisodeResult(selectedEpisode.id, { storyboard: parsed.storyboard })
        }
      }
    } catch (error) {
      console.error('콘티 생성 실패:', error)
      alert('콘티 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
      setGenerationType(null)
    }
  }

  // 전체 생성 (요약 + 콘티)
  const generateAll = async () => {
    await generateSummary()
    await generateStoryboard()
  }

  // 내보내기 (텍스트)
  const exportAsText = () => {
    if (!selectedEpisode?.simulation?.turns) return

    let text = `# ${project.title} - ${selectedEpisode.title}\n\n`

    if (selectedEpisode.result?.summary) {
      text += `## 요약\n${selectedEpisode.result.summary}\n\n`
    }

    text += `## 대사록\n`
    selectedEpisode.simulation.turns.forEach((turn) => {
      text += `\n${turn.characterName}: "${turn.dialogue}"\n`
      if (turn.action) text += `(${turn.action})\n`
    })

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title}_${selectedEpisode.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="result-tab">
      <div className="result-layout">
        {/* 에피소드 선택 사이드바 */}
        <div className="episode-sidebar">
          <h3>에피소드 목록</h3>
          <div className="episode-list">
            {project.episodes.length > 0 ? (
              project.episodes.map((ep) => (
                <button
                  key={ep.id}
                  className={`episode-item ${selectedEpisodeId === ep.id ? 'active' : ''}`}
                  onClick={() => setSelectedEpisodeId(ep.id)}
                >
                  <span className="ep-number">{ep.number}화</span>
                  <span className="ep-title">{ep.title}</span>
                  {ep.simulation?.status === 'completed' && (
                    <span className="ep-badge">완료</span>
                  )}
                </button>
              ))
            ) : (
              <p className="empty-message">
                시뮬레이션 탭에서 에피소드를 만들고 시뮬레이션을 진행해주세요.
              </p>
            )}
          </div>
        </div>

        {/* 결과 컨텐츠 */}
        <div className="result-content">
          {selectedEpisode ? (
            <div className="section">
              <div className="section-header">
                <span className="icon">📖</span>
                <h2>{selectedEpisode.title} 완성본</h2>
              </div>

              {/* 뷰 탭 */}
              <div className="view-tabs">
                {[
                  { id: 'summary', label: '요약', icon: '📝' },
                  { id: 'dialogue', label: '대사록', icon: '💬' },
                  { id: 'storyboard', label: '콘티', icon: '🎬' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`view-tab ${viewTab === tab.id ? 'active' : ''}`}
                    onClick={() => setViewTab(tab.id as ViewTab)}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* 요약 탭 */}
              {viewTab === 'summary' && (
                <div className="view-content">
                  {selectedEpisode.result?.summary ? (
                    <div className="summary-content">
                      <p>{selectedEpisode.result.summary}</p>
                      <button
                        className="btn-secondary regenerate-btn"
                        onClick={generateSummary}
                        disabled={isGenerating}
                      >
                        🔄 다시 생성
                      </button>
                    </div>
                  ) : (
                    <div className="empty-content">
                      <p>시뮬레이션 결과를 바탕으로 AI가 요약을 생성합니다.</p>
                      {selectedEpisode.simulation?.turns &&
                      selectedEpisode.simulation.turns.length > 0 ? (
                        <button
                          className="btn-primary"
                          onClick={generateSummary}
                          disabled={isGenerating || !apiKey}
                        >
                          {isGenerating && generationType === 'summary'
                            ? '⏳ 요약 생성 중...'
                            : '🚀 AI 요약 생성'}
                        </button>
                      ) : (
                        <p className="hint">먼저 시뮬레이션을 완료해주세요.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 대사록 탭 */}
              {viewTab === 'dialogue' && (
                <div className="view-content">
                  {selectedEpisode.simulation?.turns &&
                  selectedEpisode.simulation.turns.length > 0 ? (
                    <div className="dialogue-list">
                      {selectedEpisode.simulation.turns.map((turn, i) => (
                        <div key={i} className="dialogue-item">
                          <div className="dialogue-name">{turn.characterName}</div>
                          <div className="dialogue-text">"{turn.dialogue}"</div>
                          {turn.action && (
                            <div className="dialogue-action">{turn.action}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-content">
                      <p>시뮬레이션 결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 콘티 탭 */}
              {viewTab === 'storyboard' && (
                <div className="view-content">
                  {selectedEpisode.result?.storyboard &&
                  selectedEpisode.result.storyboard.length > 0 ? (
                    <div className="storyboard-section">
                      <div className="storyboard-list">
                        {selectedEpisode.result.storyboard.map((scene, i) => (
                          <div key={i} className="storyboard-item">
                            <div className="scene-number">씬 {i + 1}</div>
                            <div className="scene-desc">{scene}</div>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn-secondary regenerate-btn"
                        onClick={generateStoryboard}
                        disabled={isGenerating}
                      >
                        🔄 다시 생성
                      </button>
                    </div>
                  ) : (
                    <div className="empty-content">
                      <p>시뮬레이션 결과를 바탕으로 AI가 콘티를 제안합니다.</p>
                      {selectedEpisode.simulation?.turns &&
                      selectedEpisode.simulation.turns.length > 0 ? (
                        <button
                          className="btn-primary"
                          onClick={generateStoryboard}
                          disabled={isGenerating || !apiKey}
                        >
                          {isGenerating && generationType === 'storyboard'
                            ? '⏳ 콘티 생성 중...'
                            : '🚀 AI 콘티 생성'}
                        </button>
                      ) : (
                        <p className="hint">먼저 시뮬레이션을 완료해주세요.</p>
                      )}
                      <div className="storyboard-preview">
                        <h4>콘티 예시</h4>
                        <div className="preview-list">
                          <div className="preview-item">
                            <span className="preview-num">컷1</span>
                            <span>(와이드샷) 배경 전경</span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-num">컷2</span>
                            <span>(미디엄샷) 주인공 등장</span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-num">컷3</span>
                            <span>(클로즈업) 표정 연출</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="action-buttons">
                {selectedEpisode.simulation?.turns &&
                selectedEpisode.simulation.turns.length > 0 && (
                  <button
                    className="btn-primary"
                    onClick={generateAll}
                    disabled={isGenerating || !apiKey}
                  >
                    {isGenerating ? '⏳ 생성 중...' : '🚀 요약 + 콘티 전체 생성'}
                  </button>
                )}
                <button className="btn-secondary" onClick={exportAsText}>
                  📥 텍스트로 내보내기
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>에피소드를 선택하세요</h3>
              <p>왼쪽에서 에피소드를 선택하면 결과를 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .result-tab {
          height: 100%;
        }

        .result-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
          height: calc(100vh - 200px);
        }

        .episode-sidebar {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .episode-sidebar h3 {
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .episode-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .episode-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .episode-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .episode-item.active {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
        }

        .ep-number {
          font-size: 12px;
          color: #7c3aed;
          font-weight: 600;
        }

        .ep-title {
          flex: 1;
          font-size: 14px;
          color: #cbd5e1;
        }

        .ep-badge {
          font-size: 10px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .empty-message {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          padding: 20px;
          line-height: 1.6;
        }

        .result-content {
          overflow-y: auto;
        }

        .result-content .section {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .view-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .view-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
        }

        .view-tab.active {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
        }

        .view-content {
          flex: 1;
          overflow-y: auto;
        }

        .summary-content p {
          font-size: 15px;
          color: #cbd5e1;
          line-height: 1.8;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .regenerate-btn {
          align-self: flex-start;
        }

        .storyboard-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hint {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
        }

        .dialogue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dialogue-item {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .dialogue-name {
          font-size: 13px;
          font-weight: 600;
          color: #a855f7;
          margin-bottom: 4px;
        }

        .dialogue-text {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .dialogue-action {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin-top: 4px;
        }

        .storyboard-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .storyboard-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .scene-number {
          font-size: 12px;
          font-weight: 600;
          color: #7c3aed;
          white-space: nowrap;
        }

        .scene-desc {
          font-size: 14px;
          color: #cbd5e1;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .empty-content p {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .storyboard-preview {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          width: 100%;
          max-width: 400px;
        }

        .storyboard-preview h4 {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 12px 0;
        }

        .preview-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-item {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #64748b;
        }

        .preview-num {
          color: #7c3aed;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .result-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
