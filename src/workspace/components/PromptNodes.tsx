import { useState, useCallback, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { SinglePromptNodeData } from '../types'
import { PROMPT_NODE_DATA, PROMPT_COLORS, PROMPT_TITLES } from '../config/node-configs'

// 단일 카테고리 프롬프트 노드 (공통 컴포넌트)
function SinglePromptNode({ selected, id, data }: NodeProps<SinglePromptNodeData>) {
  const promptType = data.promptType || 'scene'
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({})
  const [userPrompt, setUserPrompt] = useState('')
  const { setNodes } = useReactFlow()

  const nodeData = PROMPT_NODE_DATA[promptType]
  const themeColor = PROMPT_COLORS[promptType]
  const title = PROMPT_TITLES[promptType]

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

  return (
    <div
      className={`prompt-single-node ${selected ? 'selected' : ''}`}
      style={{ '--prompt-color': themeColor } as React.CSSProperties}
    >
      <NodeResizer isVisible={selected} minWidth={280} minHeight={250} />

      <div
        className="prompt-node-header"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)` }}
      >
        <span>{title}</span>
        <span className="prompt-header-count">{totalSelected}개</span>
      </div>

      <div className="prompt-node-body prompt-scrollable" onMouseDown={(e) => e.stopPropagation()}>
        <input
          type="text"
          className="prompt-node-input nodrag"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="직접 입력..."
        />

        <div className="prompt-node-categories nodrag">
          {Object.entries(nodeData).map(([catKey, category]) => (
            <div key={catKey} className="prompt-mini-category">
              <div className="prompt-cat-header">
                <span className="prompt-cat-title">{category.title}</span>
              </div>
              <div className="prompt-cat-options">
                {category.options.map((opt) => {
                  const isSelected = (selectedOptions[catKey] || []).includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      className={`prompt-opt-btn ${isSelected ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        toggleOption(catKey, opt.id)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        borderColor: isSelected ? themeColor : '#ddd',
                        backgroundColor: isSelected ? `${themeColor}15` : '#fff',
                        color: isSelected ? themeColor : '#666',
                      }}
                    >
                      {isSelected && <span className="check-mark">✓</span>}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {combinedPrompt && (
          <div className="prompt-node-preview" style={{ borderLeftColor: themeColor }}>
            <div className="preview-header">
              <span style={{ color: themeColor }}>📝 프롬프트</span>
              <button className="clear-btn" onClick={handleClear} onMouseDown={(e) => e.stopPropagation()}>
                초기화
              </button>
            </div>
            <p className="preview-text">{combinedPrompt}</p>
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
