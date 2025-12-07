import { useState } from 'react'
import type { StoryProject, Episode, Scene, SimulationTurn } from './index'

interface Props {
  project: StoryProject
  updateProject: (updates: Partial<StoryProject>) => void
}

export default function SimulationTab({ project, updateProject }: Props) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // 씬 설정 상태
  const [sceneSetup, setSceneSetup] = useState<Partial<Scene>>({
    location: '',
    time: '낮',
    situation: '',
    participants: [],
    events: [],
    endCondition: '',
  })
  const [maxTurns, setMaxTurns] = useState(20)

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

  // 시뮬레이션 시작 (실제 API 연동은 나중에)
  const startSimulation = async () => {
    if (!apiKey) {
      alert('Claude API 키를 입력해주세요.')
      return
    }
    if ((sceneSetup.participants?.length || 0) < 1) {
      alert('참여 캐릭터를 1명 이상 선택해주세요.')
      return
    }

    setIsSimulating(true)
    setSimulationTurns([])

    // 데모용 시뮬레이션 (실제로는 Claude API 호출)
    const participants = sceneSetup.participants || []
    const demoTurns: SimulationTurn[] = []

    for (let i = 0; i < Math.min(5, maxTurns); i++) {
      await new Promise((r) => setTimeout(r, 1000))

      const charId = participants[i % participants.length]
      const char = project.characters.find((c) => c.id === charId)

      if (char) {
        const turn: SimulationTurn = {
          characterId: charId,
          characterName: char.name,
          dialogue: `[${char.name}의 대화 ${i + 1}] - Claude API 연동 시 실제 대화가 생성됩니다.`,
          action: '(대기 중)',
          emotion: '중립',
        }
        demoTurns.push(turn)
        setSimulationTurns([...demoTurns])
      }
    }

    setIsSimulating(false)
  }

  // 시뮬레이션 중지
  const stopSimulation = () => {
    setIsSimulating(false)
  }

  return (
    <div className="simulation-tab">
      <div className="sim-layout">
        {/* 좌측: 설정 패널 */}
        <div className="sim-setup-panel">
          {/* API 키 */}
          <div className="section">
            <div className="section-header">
              <span className="icon">🔑</span>
              <h2>API 설정</h2>
            </div>
            <div className="form-group">
              <label>Claude API 키</label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Claude API 키를 입력하세요"
              />
              <p className="form-hint">
                시뮬레이션에는 Claude API가 사용됩니다.
              </p>
            </div>
          </div>

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
                placeholder="예: 주인공 첫 각성"
              />
            </div>

            <div className="form-group">
              <label>참여 캐릭터</label>
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
                {['중간에 제3자 등장', '몬스터 출현', '위험 상황 발생', '비밀 폭로'].map((event) => (
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
              <label>결말 조건</label>
              <input
                type="text"
                className="form-input"
                value={sceneSetup.endCondition}
                onChange={(e) => setSceneSetup({ ...sceneSetup, endCondition: e.target.value })}
                placeholder="예: 첫 몬스터 처치하면 종료"
              />
            </div>

            <div className="form-group">
              <label>최대 턴 수</label>
              <input
                type="number"
                className="form-input"
                value={maxTurns}
                onChange={(e) => setMaxTurns(Number(e.target.value))}
                min={5}
                max={50}
              />
            </div>

            <button
              className="btn-primary start-btn"
              onClick={startSimulation}
              disabled={isSimulating || project.characters.length === 0}
            >
              {isSimulating ? '⏳ 시뮬레이션 중...' : '▶ 시뮬레이션 시작'}
            </button>
          </div>
        </div>

        {/* 우측: 시뮬레이션 결과 */}
        <div className="sim-result-panel">
          <div className="section">
            <div className="section-header">
              <span className="icon">💬</span>
              <h2>시뮬레이션 {isSimulating ? `진행 중... (${simulationTurns.length}/${maxTurns})` : '결과'}</h2>
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
                  return (
                    <div key={i} className="dialogue-turn">
                      <div className="turn-avatar">
                        {char?.name.charAt(0) || '?'}
                      </div>
                      <div className="turn-content">
                        <div className="turn-header">
                          <span className="turn-name">{turn.characterName}</span>
                          <span className="turn-emotion">{turn.emotion}</span>
                        </div>
                        <p className="turn-dialogue">{turn.dialogue}</p>
                        {turn.action && (
                          <p className="turn-action">{turn.action}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 작가 개입 패널 */}
            {isSimulating && (
              <div className="intervention-panel">
                <h3>🎬 작가 개입</h3>
                <div className="intervention-options">
                  <label>
                    <input type="radio" name="intervention" defaultChecked />
                    <span>이대로 진행</span>
                  </label>
                  <label>
                    <input type="radio" name="intervention" />
                    <span>몬스터 지금 등장시키기</span>
                  </label>
                  <label>
                    <input type="radio" name="intervention" />
                    <span>직접 입력</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .simulation-tab {
          height: 100%;
        }

        .sim-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          height: calc(100vh - 200px);
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
          background: linear-gradient(135deg, #7c3aed, #a855f7);
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

        .intervention-panel {
          margin-top: 16px;
          padding: 16px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
        }

        .intervention-panel h3 {
          font-size: 14px;
          font-weight: 600;
          color: #a855f7;
          margin: 0 0 12px 0;
        }

        .intervention-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .intervention-options label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
        }

        .intervention-options input {
          accent-color: #7c3aed;
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
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
