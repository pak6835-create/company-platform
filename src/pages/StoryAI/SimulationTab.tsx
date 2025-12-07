import { useState, useRef } from 'react'
import type { StoryProject, Episode, Scene, SimulationTurn } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
  apiKey: string
  onNext: () => void
}

export default function SimulationTab({ project, updateProject, apiKey, onNext }: Props) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(0)
  const stopRef = useRef(false)

  // 씬 설정 상태
  const [sceneSetup, setSceneSetup] = useState<Partial<Scene>>({
    location: '',
    time: '낮',
    situation: '',
    participants: [],
    events: [],
    endCondition: '',
  })
  const [maxTurns, setMaxTurns] = useState(10)

  // 시뮬레이션 결과
  const [simulationTurns, setSimulationTurns] = useState<SimulationTurn[]>([])

  const selectedEpisode = project.episodes.find((e) => e.id === selectedEpisodeId)

  // 에피소드 추가
  const addEpisode = () => {
    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      number: project.episodes.length + 1,
      title: `${project.episodes.length + 1}화`,
      scenes: [],
    }
    updateProject({ episodes: [...project.episodes, newEp] })
    setSelectedEpisodeId(newEp.id)
  }

  // 참여 캐릭터 토글
  const toggleParticipant = (charId: string) => {
    const participants = sceneSetup.participants || []
    if (participants.includes(charId)) {
      setSceneSetup({
        ...sceneSetup,
        participants: participants.filter((p) => p !== charId),
      })
    } else {
      setSceneSetup({
        ...sceneSetup,
        participants: [...participants, charId],
      })
    }
  }

  // 이벤트 토글
  const toggleEvent = (event: string) => {
    const events = sceneSetup.events || []
    if (events.includes(event)) {
      setSceneSetup({
        ...sceneSetup,
        events: events.filter((e) => e !== event),
      })
    } else {
      setSceneSetup({
        ...sceneSetup,
        events: [...events, event],
      })
    }
  }

  // 캐릭터 시스템 프롬프트 생성
  const buildCharacterPrompt = (charId: string) => {
    const char = project.characters.find((c) => c.id === charId)
    if (!char) return ''

    const personalityDesc = []
    if (char.personality.introvert_extrovert < 40) personalityDesc.push('내향적')
    else if (char.personality.introvert_extrovert > 60) personalityDesc.push('외향적')
    if (char.personality.emotional_rational < 40) personalityDesc.push('감정적')
    else if (char.personality.emotional_rational > 60) personalityDesc.push('이성적')
    if (char.personality.timid_bold > 60) personalityDesc.push('대담함')
    if (char.personality.serious_humorous > 60) personalityDesc.push('유머러스')

    const speechDesc = []
    if (char.speechStyle.formal_casual < 40) speechDesc.push('존댓말 사용')
    else if (char.speechStyle.formal_casual > 60) speechDesc.push('반말 사용')
    if (char.speechStyle.quiet_talkative < 40) speechDesc.push('말이 적음')
    else if (char.speechStyle.quiet_talkative > 60) speechDesc.push('말이 많음')

    return `
캐릭터: ${char.name} (${char.role})
나이: ${char.age}
목표: ${char.goal}
비밀: ${char.secret}
성격: ${personalityDesc.join(', ') || '보통'}
말투: ${speechDesc.join(', ') || '보통'}, ${char.speechStyle.habits.join(', ') || '특별한 습관 없음'}
예시 대사: ${char.speechStyle.examples.join(' / ') || '없음'}
`
  }

  // 시뮬레이션 시작
  const startSimulation = async () => {
    if (!apiKey) {
      alert('설정 탭에서 Gemini API 키를 먼저 입력해주세요.')
      return
    }
    if ((sceneSetup.participants?.length || 0) < 2) {
      alert('참여 캐릭터를 2명 이상 선택해주세요.')
      return
    }

    setIsSimulating(true)
    setSimulationTurns([])
    setCurrentTurn(0)
    stopRef.current = false

    const participants = sceneSetup.participants || []
    const turns: SimulationTurn[] = []
    let conversationHistory = ''

    // 씬 컨텍스트
    const sceneContext = `
[세계관]
${project.worldSetting?.description || ''}

[현재 씬]
장소: ${sceneSetup.location || '어딘가'}
시간: ${sceneSetup.time || '낮'}
상황: ${sceneSetup.situation || '일상적인 상황'}
예정된 이벤트: ${sceneSetup.events?.join(', ') || '없음'}

[참여 캐릭터]
${participants.map((pid) => buildCharacterPrompt(pid)).join('\n')}
`

    for (let i = 0; i < maxTurns; i++) {
      if (stopRef.current) break

      const charIndex = i % participants.length
      const charId = participants[charIndex]
      const char = project.characters.find((c) => c.id === charId)

      if (!char) continue

      setCurrentTurn(i + 1)

      const prompt = `
${sceneContext}

[이전 대화]
${conversationHistory || '(아직 대화 없음 - 첫 대화를 시작하세요)'}

[지시사항]
당신은 "${char.name}" 캐릭터입니다.
위 캐릭터 설정에 맞게 다음 대화를 해주세요.
반드시 캐릭터의 성격과 말투를 유지하세요.

다음 형식의 JSON으로만 응답하세요:
{
  "dialogue": "캐릭터의 대사",
  "action": "캐릭터의 행동 묘사 (괄호 없이)",
  "emotion": "현재 감정 (한 단어)"
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
                maxOutputTokens: 500,
              },
            }),
          }
        )

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message)
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const turn: SimulationTurn = {
              characterId: charId,
              characterName: char.name,
              dialogue: parsed.dialogue || '',
              action: parsed.action || '',
              emotion: parsed.emotion || '중립',
            }
            turns.push(turn)
            setSimulationTurns([...turns])

            // 대화 히스토리에 추가
            conversationHistory += `\n${char.name}: "${parsed.dialogue}" (${parsed.action})`
          }
        }

        // 0.5초 딜레이
        await new Promise((r) => setTimeout(r, 500))
      } catch (error) {
        console.error('시뮬레이션 턴 실패:', error)
        break
      }
    }

    // 에피소드에 시뮬레이션 결과 저장
    if (selectedEpisodeId && turns.length > 0) {
      updateProject({
        episodes: project.episodes.map((ep) =>
          ep.id === selectedEpisodeId
            ? {
                ...ep,
                simulation: {
                  turns,
                  status: 'completed' as const,
                },
              }
            : ep
        ),
      })
    }

    setIsSimulating(false)
  }

  // 시뮬레이션 중지
  const stopSimulation = () => {
    stopRef.current = true
    setIsSimulating(false)
  }

  const canProceed = project.episodes.some((ep) => ep.simulation?.status === 'completed')

  return (
    <div className="simulation-tab">
      <div className="sim-layout">
        {/* 좌측: 설정 패널 */}
        <div className="sim-setup-panel">
          {/* 에피소드 선택 */}
          <div className="section">
            <div className="section-header">
              <span className="icon">📺</span>
              <h2>에피소드</h2>
            </div>
            <div className="episode-list">
              {project.episodes.map((ep) => (
                <button
                  key={ep.id}
                  className={`episode-btn ${selectedEpisodeId === ep.id ? 'active' : ''}`}
                  onClick={() => setSelectedEpisodeId(ep.id)}
                >
                  {ep.title}
                  {ep.simulation?.status === 'completed' && <span className="done-badge">✓</span>}
                </button>
              ))}
              <button className="add-episode-btn" onClick={addEpisode}>
                + 에피소드 추가
              </button>
            </div>
          </div>

          {/* 씬 설정 */}
          <div className="section">
            <div className="section-header">
              <span className="icon">🎬</span>
              <h2>씬 설정</h2>
            </div>

            <div className="form-group">
              <label>장소</label>
              <input
                type="text"
                className="form-input"
                value={sceneSetup.location}
                onChange={(e) => setSceneSetup({ ...sceneSetup, location: e.target.value })}
                placeholder="예: 던전 입구, 카페"
              />
            </div>

            <div className="form-group">
              <label>시간</label>
              <select
                className="form-select"
                value={sceneSetup.time}
                onChange={(e) => setSceneSetup({ ...sceneSetup, time: e.target.value })}
              >
                <option value="아침">아침</option>
                <option value="낮">낮</option>
                <option value="저녁">저녁</option>
                <option value="밤">밤</option>
                <option value="새벽">새벽</option>
              </select>
            </div>

            <div className="form-group">
              <label>상황</label>
              <input
                type="text"
                className="form-input"
                value={sceneSetup.situation}
                onChange={(e) => setSceneSetup({ ...sceneSetup, situation: e.target.value })}
                placeholder="예: 주인공 첫 각성, 우연한 만남"
              />
            </div>

            <div className="form-group">
              <label>참여 캐릭터 (2명 이상 선택)</label>
              {project.characters.length > 0 ? (
                <div className="participant-list">
                  {project.characters.map((char) => (
                    <label key={char.id} className="participant-checkbox">
                      <input
                        type="checkbox"
                        checked={sceneSetup.participants?.includes(char.id)}
                        onChange={() => toggleParticipant(char.id)}
                      />
                      <span>{char.name} ({char.role})</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="empty-hint">먼저 캐릭터를 추가해주세요.</p>
              )}
            </div>

            <div className="form-group">
              <label>이벤트 트리거</label>
              <div className="event-options">
                {['중간에 제3자 등장', '몬스터 출현', '위험 상황 발생', '비밀 폭로', '갈등 발생'].map((event) => (
                  <label key={event} className="event-checkbox">
                    <input
                      type="checkbox"
                      checked={sceneSetup.events?.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>대화 턴 수</label>
              <select
                className="form-select"
                value={maxTurns}
                onChange={(e) => setMaxTurns(Number(e.target.value))}
              >
                <option value={5}>5턴</option>
                <option value={10}>10턴</option>
                <option value={15}>15턴</option>
                <option value={20}>20턴</option>
              </select>
            </div>

            <button
              className="btn-primary start-btn"
              onClick={startSimulation}
              disabled={isSimulating || project.characters.length < 2 || (sceneSetup.participants?.length || 0) < 2}
            >
              {isSimulating ? `⏳ 진행 중... (${currentTurn}/${maxTurns})` : '▶ 시뮬레이션 시작'}
            </button>

            {project.characters.length < 2 && (
              <p className="warning-text">⚠️ 캐릭터가 2명 이상 필요합니다.</p>
            )}
          </div>
        </div>

        {/* 우측: 시뮬레이션 결과 */}
        <div className="sim-result-panel">
          <div className="section">
            <div className="section-header">
              <span className="icon">💬</span>
              <h2>
                시뮬레이션 {isSimulating ? `진행 중... (${currentTurn}/${maxTurns})` : '결과'}
              </h2>
              {isSimulating && (
                <button className="stop-btn" onClick={stopSimulation}>
                  ⏹ 중지
                </button>
              )}
            </div>

            <div className="dialogue-container">
              {simulationTurns.length === 0 ? (
                <div className="empty-result">
                  <p>시뮬레이션을 시작하면 캐릭터들의 대화가 여기에 표시됩니다.</p>
                </div>
              ) : (
                simulationTurns.map((turn, i) => {
                  const char = project.characters.find((c) => c.id === turn.characterId)
                  const roleColor = char?.role === '주인공' ? '#3b82f6' :
                    char?.role === '악역' ? '#ef4444' :
                    char?.role === '조력자' ? '#10b981' : '#7c3aed'

                  return (
                    <div key={i} className="dialogue-turn">
                      <div className="turn-avatar" style={{ background: roleColor }}>
                        {char?.name.charAt(0) || '?'}
                      </div>
                      <div className="turn-content">
                        <div className="turn-header">
                          <span className="turn-name">{turn.characterName}</span>
                          <span className="turn-emotion">{turn.emotion}</span>
                        </div>
                        <p className="turn-dialogue">"{turn.dialogue}"</p>
                        {turn.action && (
                          <p className="turn-action">({turn.action})</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      {canProceed && (
        <div className="next-step">
          <button className="btn-primary" onClick={onNext}>
            다음 단계: 결과 확인 →
          </button>
        </div>
      )}

      <style>{`
        .simulation-tab {
          height: 100%;
        }

        .sim-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          height: calc(100vh - 240px);
        }

        .sim-setup-panel {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sim-result-panel {
          overflow-y: auto;
        }

        .sim-result-panel .section {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .episode-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .episode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .episode-btn:hover,
        .episode-btn.active {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.4);
          color: #a855f7;
        }

        .done-badge {
          color: #10b981;
          font-weight: bold;
        }

        .add-episode-btn {
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .add-episode-btn:hover {
          border-color: #7c3aed;
          color: #a855f7;
        }

        .participant-list,
        .event-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant-checkbox,
        .event-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
        }

        .participant-checkbox input,
        .event-checkbox input {
          accent-color: #7c3aed;
        }

        .empty-hint {
          font-size: 13px;
          color: #64748b;
        }

        .start-btn {
          width: 100%;
          margin-top: 8px;
        }

        .warning-text {
          color: #f59e0b;
          font-size: 12px;
          margin-top: 8px;
        }

        .dialogue-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .empty-result {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }

        .dialogue-turn {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          margin-bottom: 12px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .turn-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }

        .turn-content {
          flex: 1;
        }

        .turn-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .turn-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .turn-emotion {
          font-size: 11px;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .turn-dialogue {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
        }

        .turn-action {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin: 4px 0 0 0;
        }

        .section-header .stop-btn {
          margin-left: auto;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
        }

        @media (max-width: 900px) {
          .sim-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
