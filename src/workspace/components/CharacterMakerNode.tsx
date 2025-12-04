import { useState, useEffect, useCallback } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'

// 캐릭터 부위 정의
interface BodyPart {
  id: string
  name: string
  x: number // % 위치
  y: number
  width: number
  height: number
  options: { id: string; label: string; prompt: string }[]
}

const BODY_PARTS: BodyPart[] = [
  {
    id: 'head',
    name: '머리',
    x: 42, y: 2, width: 16, height: 15,
    options: [
      { id: 'hair_short', label: '짧은 머리', prompt: 'short hair' },
      { id: 'hair_long', label: '긴 머리', prompt: 'long hair' },
      { id: 'hair_wavy', label: '웨이브 머리', prompt: 'wavy hair' },
      { id: 'hair_straight', label: '스트레이트', prompt: 'straight hair' },
      { id: 'hair_ponytail', label: '포니테일', prompt: 'ponytail' },
      { id: 'hair_braid', label: '땋은 머리', prompt: 'braided hair' },
    ]
  },
  {
    id: 'face',
    name: '얼굴',
    x: 42, y: 17, width: 16, height: 10,
    options: [
      { id: 'face_round', label: '동글', prompt: 'round face' },
      { id: 'face_oval', label: '계란형', prompt: 'oval face' },
      { id: 'face_sharp', label: '날카로운', prompt: 'sharp face' },
      { id: 'eye_big', label: '큰 눈', prompt: 'big eyes' },
      { id: 'eye_small', label: '작은 눈', prompt: 'small eyes' },
      { id: 'expression_smile', label: '미소', prompt: 'smiling' },
      { id: 'expression_serious', label: '진지', prompt: 'serious expression' },
    ]
  },
  {
    id: 'upper_body',
    name: '상의',
    x: 35, y: 27, width: 30, height: 22,
    options: [
      { id: 'top_shirt', label: '셔츠', prompt: 'shirt' },
      { id: 'top_tshirt', label: '티셔츠', prompt: 't-shirt' },
      { id: 'top_jacket', label: '재킷', prompt: 'jacket' },
      { id: 'top_hoodie', label: '후디', prompt: 'hoodie' },
      { id: 'top_suit', label: '정장', prompt: 'suit' },
      { id: 'top_dress', label: '원피스', prompt: 'dress' },
      { id: 'top_armor', label: '갑옷', prompt: 'armor' },
    ]
  },
  {
    id: 'left_arm',
    name: '왼팔',
    x: 10, y: 27, width: 24, height: 30,
    options: [
      { id: 'arm_bare', label: '맨손', prompt: 'bare arms' },
      { id: 'arm_sleeve', label: '긴소매', prompt: 'long sleeves' },
      { id: 'arm_glove', label: '장갑', prompt: 'gloves' },
      { id: 'arm_bracer', label: '팔찌', prompt: 'bracelet' },
      { id: 'arm_bandage', label: '붕대', prompt: 'bandaged arm' },
    ]
  },
  {
    id: 'right_arm',
    name: '오른팔',
    x: 66, y: 27, width: 24, height: 30,
    options: [
      { id: 'arm_bare', label: '맨손', prompt: 'bare arms' },
      { id: 'arm_sleeve', label: '긴소매', prompt: 'long sleeves' },
      { id: 'arm_glove', label: '장갑', prompt: 'gloves' },
      { id: 'arm_bracer', label: '팔찌', prompt: 'bracelet' },
      { id: 'arm_tattoo', label: '문신', prompt: 'arm tattoo' },
    ]
  },
  {
    id: 'lower_body',
    name: '하의',
    x: 35, y: 49, width: 30, height: 20,
    options: [
      { id: 'bottom_pants', label: '바지', prompt: 'pants' },
      { id: 'bottom_jeans', label: '청바지', prompt: 'jeans' },
      { id: 'bottom_shorts', label: '반바지', prompt: 'shorts' },
      { id: 'bottom_skirt', label: '치마', prompt: 'skirt' },
      { id: 'bottom_long_skirt', label: '롱스커트', prompt: 'long skirt' },
    ]
  },
  {
    id: 'legs',
    name: '다리',
    x: 35, y: 69, width: 30, height: 22,
    options: [
      { id: 'leg_bare', label: '맨다리', prompt: 'bare legs' },
      { id: 'leg_stockings', label: '스타킹', prompt: 'stockings' },
      { id: 'leg_tights', label: '타이츠', prompt: 'tights' },
      { id: 'leg_boots', label: '부츠', prompt: 'boots' },
    ]
  },
  {
    id: 'feet',
    name: '신발',
    x: 35, y: 91, width: 30, height: 9,
    options: [
      { id: 'shoe_sneakers', label: '운동화', prompt: 'sneakers' },
      { id: 'shoe_boots', label: '부츠', prompt: 'boots' },
      { id: 'shoe_heels', label: '힐', prompt: 'high heels' },
      { id: 'shoe_sandals', label: '샌들', prompt: 'sandals' },
      { id: 'shoe_barefoot', label: '맨발', prompt: 'barefoot' },
    ]
  },
  {
    id: 'accessory',
    name: '악세서리',
    x: 70, y: 5, width: 25, height: 20,
    options: [
      { id: 'acc_hat', label: '모자', prompt: 'hat' },
      { id: 'acc_glasses', label: '안경', prompt: 'glasses' },
      { id: 'acc_earring', label: '귀걸이', prompt: 'earrings' },
      { id: 'acc_necklace', label: '목걸이', prompt: 'necklace' },
      { id: 'acc_bag', label: '가방', prompt: 'bag' },
      { id: 'acc_scarf', label: '스카프', prompt: 'scarf' },
    ]
  },
  {
    id: 'weapon',
    name: '무기/도구',
    x: 5, y: 5, width: 25, height: 20,
    options: [
      { id: 'weapon_sword', label: '검', prompt: 'holding sword' },
      { id: 'weapon_gun', label: '총', prompt: 'holding gun' },
      { id: 'weapon_staff', label: '지팡이', prompt: 'holding staff' },
      { id: 'weapon_bow', label: '활', prompt: 'holding bow' },
      { id: 'weapon_shield', label: '방패', prompt: 'holding shield' },
      { id: 'weapon_book', label: '책', prompt: 'holding book' },
    ]
  },
]

// 프리셋 타입
interface CharacterPreset {
  id: string
  name: string
  selections: { [partId: string]: string[] }
  createdAt: number
}

// 노드 데이터 타입
interface CharacterMakerNodeData {
  selections?: { [partId: string]: string[] }
  combinedPrompt?: string
}

export function CharacterMakerNode({ data, selected, id }: NodeProps<CharacterMakerNodeData>) {
  const [selections, setSelections] = useState<{ [partId: string]: string[] }>(data.selections || {})
  const [activePart, setActivePart] = useState<string | null>(null)
  const [presets, setPresets] = useState<CharacterPreset[]>(() => {
    const saved = localStorage.getItem('character_presets')
    return saved ? JSON.parse(saved) : []
  })
  const [presetName, setPresetName] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const { setNodes } = useReactFlow()

  // 프리셋 저장
  useEffect(() => {
    localStorage.setItem('character_presets', JSON.stringify(presets))
  }, [presets])

  // 프롬프트 생성
  const getCombinedPrompt = useCallback(() => {
    const parts: string[] = ['character', 'T-pose', 'full body']
    Object.entries(selections).forEach(([partId, optIds]) => {
      const part = BODY_PARTS.find(p => p.id === partId)
      if (part) {
        optIds.forEach(optId => {
          const opt = part.options.find(o => o.id === optId)
          if (opt) parts.push(opt.prompt)
        })
      }
    })
    return parts.join(', ')
  }, [selections])

  // 노드 데이터 업데이트
  useEffect(() => {
    const combinedPrompt = getCombinedPrompt()
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, selections, combinedPrompt } }
        }
        return n
      })
    )
  }, [selections, id, setNodes, getCombinedPrompt])

  // 옵션 토글
  const toggleOption = (partId: string, optId: string) => {
    setSelections(prev => {
      const current = prev[partId] || []
      const newList = current.includes(optId)
        ? current.filter(i => i !== optId)
        : [...current, optId]
      return { ...prev, [partId]: newList }
    })
  }

  // 프리셋 저장
  const savePreset = () => {
    if (!presetName.trim()) return
    const newPreset: CharacterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      selections: { ...selections },
      createdAt: Date.now()
    }
    setPresets(prev => [newPreset, ...prev].slice(0, 20))
    setPresetName('')
  }

  // 프리셋 불러오기
  const loadPreset = (preset: CharacterPreset) => {
    setSelections({ ...preset.selections })
    setShowPresets(false)
  }

  // 프리셋 삭제
  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId))
  }

  // 선택 초기화
  const clearAll = () => {
    setSelections({})
    setActivePart(null)
  }

  // 선택된 총 개수
  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className={`character-maker-node ${selected ? 'selected' : ''}`}>
      <Handle type="source" position={Position.Right} id="char-out" />
      <NodeResizer isVisible={selected} minWidth={400} minHeight={500} />

      <div className="char-maker-header">
        <span>🎭 캐릭터 메이커</span>
        <div className="char-maker-actions">
          <button onClick={() => setShowPresets(!showPresets)} title="프리셋">
            📁
          </button>
          <button onClick={clearAll} title="초기화">
            🔄
          </button>
        </div>
      </div>

      <div className="char-maker-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {/* 프리셋 패널 */}
        {showPresets && (
          <div className="char-preset-panel">
            <div className="preset-save">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="프리셋 이름..."
                className="nodrag"
              />
              <button onClick={savePreset} disabled={!presetName.trim()}>저장</button>
            </div>
            <div className="preset-list">
              {presets.length === 0 ? (
                <div className="preset-empty">저장된 프리셋 없음</div>
              ) : (
                presets.map(preset => (
                  <div key={preset.id} className="preset-item">
                    <span onClick={() => loadPreset(preset)}>{preset.name}</span>
                    <button onClick={() => deletePreset(preset.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 캐릭터 실루엣 */}
        <div className="char-silhouette">
          {/* T포즈 배경 */}
          <svg viewBox="0 0 100 100" className="char-tpose-bg">
            {/* 머리 */}
            <circle cx="50" cy="10" r="8" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 몸통 */}
            <rect x="40" y="18" width="20" height="30" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 왼팔 */}
            <rect x="10" y="20" width="30" height="8" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 오른팔 */}
            <rect x="60" y="20" width="30" height="8" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 하체 */}
            <rect x="40" y="48" width="20" height="15" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 왼다리 */}
            <rect x="40" y="63" width="8" height="30" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
            {/* 오른다리 */}
            <rect x="52" y="63" width="8" height="30" rx="2" fill="#e5e7eb" stroke="#d1d5db" />
          </svg>

          {/* 클릭 가능한 부위 영역 */}
          {BODY_PARTS.map(part => {
            const hasSelection = (selections[part.id] || []).length > 0
            return (
              <div
                key={part.id}
                className={`char-part-area ${activePart === part.id ? 'active' : ''} ${hasSelection ? 'has-selection' : ''}`}
                style={{
                  left: `${part.x}%`,
                  top: `${part.y}%`,
                  width: `${part.width}%`,
                  height: `${part.height}%`,
                }}
                onClick={() => setActivePart(activePart === part.id ? null : part.id)}
                title={part.name}
              >
                <span className="part-label">{part.name}</span>
                {hasSelection && <span className="part-count">{selections[part.id].length}</span>}
              </div>
            )
          })}
        </div>

        {/* 선택된 부위의 옵션 */}
        {activePart && (
          <div className="char-options-panel">
            <div className="options-header">
              <span>{BODY_PARTS.find(p => p.id === activePart)?.name}</span>
              <button onClick={() => setActivePart(null)}>✕</button>
            </div>
            <div className="options-grid">
              {BODY_PARTS.find(p => p.id === activePart)?.options.map(opt => {
                const isSelected = (selections[activePart] || []).includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    className={`char-option-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleOption(activePart, opt.id)}
                  >
                    {isSelected && '✓ '}{opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 선택된 항목 요약 */}
        {totalSelected > 0 && (
          <div className="char-summary">
            <div className="summary-title">선택됨 ({totalSelected})</div>
            <div className="summary-tags">
              {Object.entries(selections).map(([partId, optIds]) =>
                optIds.map(optId => {
                  const part = BODY_PARTS.find(p => p.id === partId)
                  const opt = part?.options.find(o => o.id === optId)
                  if (!opt) return null
                  return (
                    <span
                      key={`${partId}-${optId}`}
                      className="summary-tag"
                      onClick={() => toggleOption(partId, optId)}
                    >
                      {opt.label} ✕
                    </span>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* 생성된 프롬프트 미리보기 */}
        <div className="char-prompt-preview">
          <label>📝 생성될 프롬프트</label>
          <p>{getCombinedPrompt()}</p>
        </div>
      </div>
    </div>
  )
}
