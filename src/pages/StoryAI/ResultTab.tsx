import { useState } from 'react'
import type { StoryProject } from './index'

interface Props {
  project: StoryProject
}

type ViewTab = 'summary' | 'dialogue' | 'storyboard'

export default function ResultTab({ project }: Props) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    project.episodes[0]?.id || null
  )
  const [viewTab, setViewTab] = useState<ViewTab>('summary')

  const selectedEpisode = project.episodes.find((e) => e.id === selectedEpisodeId)

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
                    </div>
                  ) : (
                    <div className="empty-content">
                      <p>시뮬레이션을 완료하면 AI가 자동으로 요약을 생성합니다.</p>
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
                    <div className="storyboard-list">
                      {selectedEpisode.result.storyboard.map((scene, i) => (
                        <div key={i} className="storyboard-item">
                          <div className="scene-number">씬 {i + 1}</div>
                          <div className="scene-desc">{scene}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-content">
                      <p>시뮬레이션을 완료하면 AI가 콘티 제안을 생성합니다.</p>
                      <div className="storyboard-preview">
                        <h4>콘티 예시</h4>
                        <div className="preview-list">
                          <div className="preview-item">
                            <span className="preview-num">씬1</span>
                            <span>배경 전경 (와이드샷)</span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-num">씬2</span>
                            <span>주인공 뒷모습 (미디엄샷)</span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-num">씬3</span>
                            <span>주인공 눈 클로즈업</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="action-buttons">
                <button className="btn-secondary" onClick={exportAsText}>
                  📥 텍스트로 내보내기
                </button>
                <button className="btn-secondary">
                  🔄 다시 시뮬레이션
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
