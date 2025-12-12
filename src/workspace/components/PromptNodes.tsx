import { useState, useCallback, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { SinglePromptNodeData } from '../types'
import { PROMPT_NODE_DATA, PROMPT_COLORS, PROMPT_TITLES } from '../config/node-configs'

// 단일 카테고리 프롬프트 노드 (공통 컴포넌트)
function SinglePromptNode({ selected, id, data }: NodeProps<SinglePromptNodeData>) {
  const promptType = data.promptType || 'scene'
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({})
  const [userPrompt, setUserPrompt] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const { setNodes } = useReactFlow()

  const nodeData = PROMPT_NODE_DATA[promptType as keyof typeof PROMPT_NODE_DATA] || PROMPT_NODE_DATA.scene
  const themeColor = PROMPT_COLORS[promptType as keyof typeof PROMPT_COLORS] || PROMPT_COLORS.scene
  const title = PROMPT_TITLES[promptType as keyof typeof PROMPT_TITLES] || '프롬프트'

  const toggleOption = useCallback((catKey: string, optId: string) => {
    setSelectedOptions((prev) => {
      const curr = prev[catKey] || []
      return {
        ...prev,
        [catKey]: curr.includes(optId) ? curr.filter((i) => i !== optId) : [...curr, optId],
      }
    })
  }, [])

  const getCombinedPrompt = useCallback(() => {
    const parts: string[] = []
    if (userPrompt.trim()) parts.push(userPrompt.trim())

    Object.entries(nodeData).forEach(([catKey, category]) => {
      const selectedIds = selectedOptions[catKey] || []
      selectedIds.forEach((optId) => {
        const opt = category.options.find((o) => o.id === optId)
        if (opt) parts.push(opt.prompt)
      })
    })

    return parts.join(', ')
  }, [selectedOptions, userPrompt, nodeData])

  const totalSelected = Object.values(selectedOptions).reduce((sum, arr) => sum + arr.length, 0)
  const combinedPrompt = getCombinedPrompt()
  const prevPromptRef = useRef<string>('')

  useEffect(() => {
    if (prevPromptRef.current !== combinedPrompt) {
      prevPromptRef.current = combinedPrompt
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return { ...n, data: { ...n.data, combinedPrompt } }
          }
          return n
        })
      )
    }
  }, [combinedPrompt, id, setNodes])

  const handleClear = () => {
    setSelectedOptions({})
    setUserPrompt('')
  }

  // 카테고리별 선택된 옵션 수
  const getSelectedCount = (catKey: string) => (selectedOptions[catKey] || []).length

  return (
    <div
      className={`prompt-single-node ${selected ? 'selected' : ''}`}
      style={{ '--prompt-color': themeColor } as React.CSSProperties}
    >
      <NodeResizer isVisible={selected} minWidth={320} minHeight={200} />

      <div
        className="prompt-node-header"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)` }}
      >
        <span>{title}</span>
        <span className="prompt-header-count">{totalSelected}개</span>
      </div>

      <div className="prompt-node-body-compact" onMouseDown={(e) => e.stopPropagation()}>
        {/* 직접 입력 */}
        <input
          type="text"
          className="prompt-node-input nodrag"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="직접 입력..."
        />

        {/* 카테고리 버튼 그리드 */}
        <div className="prompt-cat-grid nodrag">
          {Object.entries(nodeData).map(([catKey, category]) => {
            const count = getSelectedCount(catKey)
            const isExpanded = expandedCat === catKey
            return (
              <button
                key={catKey}
                className={`prompt-cat-btn ${count > 0 ? 'has-selection' : ''} ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedCat(isExpanded ? null : catKey)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  borderColor: count > 0 ? themeColor : '#e5e7eb',
                  backgroundColor: count > 0 ? `${themeColor}10` : '#fff',
                }}
              >
                <span className="cat-btn-title">{category.title}</span>
                {count > 0 && (
                  <span className="cat-btn-count" style={{ backgroundColor: themeColor }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 확장된 카테고리 옵션 */}
        {expandedCat && nodeData[expandedCat] && (
          <div className="prompt-expanded-options nodrag">
            <div className="expanded-header">
              <span>{nodeData[expandedCat].title}</span>
              <button
                className="expanded-close"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedCat(null)
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ✕
              </button>
            </div>
            <div className="expanded-options-grid">
              {nodeData[expandedCat].options.map((opt) => {
                const isSelected = (selectedOptions[expandedCat] || []).includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    className={`prompt-opt-chip ${isSelected ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(expandedCat, opt.id)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      borderColor: isSelected ? themeColor : '#ddd',
                      backgroundColor: isSelected ? `${themeColor}20` : '#fff',
                      color: isSelected ? themeColor : '#555',
                    }}
                  >
                    {isSelected && <span className="chip-check">✓</span>}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 선택된 옵션 태그 표시 */}
        {totalSelected > 0 && (
          <div className="prompt-selected-tags">
            {Object.entries(selectedOptions).map(([catKey, ids]) =>
              ids.map((optId) => {
                const opt = nodeData[catKey]?.options.find((o) => o.id === optId)
                if (!opt) return null
                return (
                  <span
                    key={optId}
                    className="selected-tag"
                    style={{ backgroundColor: `${themeColor}15`, color: themeColor, borderColor: themeColor }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(catKey, optId)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {opt.label} ✕
                  </span>
                )
              })
            )}
            <button
              className="clear-all-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              전체 삭제
            </button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="prompt-out" />
    </div>
  )
}

// 장면 프롬프트 노드
export function PromptSceneNode(props: NodeProps<SinglePromptNodeData>) {
  return <SinglePromptNode {...props} data={{ ...props.data, promptType: 'scene' }} />
}

// 캐릭터 프롬프트 노드
export function PromptCharacterNode(props: NodeProps<SinglePromptNodeData>) {
  return <SinglePromptNode {...props} data={{ ...props.data, promptType: 'character' }} />
}

// 소품 프롬프트 노드
export function PromptPropsNode(props: NodeProps<SinglePromptNodeData>) {
  return <SinglePromptNode {...props} data={{ ...props.data, promptType: 'props' }} />
}
