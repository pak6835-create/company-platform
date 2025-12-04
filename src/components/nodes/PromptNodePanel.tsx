import { useState, useCallback, useMemo } from 'react'
import { SCENE_NODE_DATA, CHARACTER_NODE_DATA, PROPS_NODE_DATA, NODE_COLORS, NodeData } from './node-data'
import './PromptNodePanel.css'

interface PromptNodePanelProps {
  onPromptGenerated: (prompt: string) => void
  onClose: () => void
}

type TabType = 'scene' | 'character' | 'props'

export default function PromptNodePanel({ onPromptGenerated, onClose }: PromptNodePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scene')
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({})
  const [userPrompt, setUserPrompt] = useState('')

  const getNodeData = useCallback((): NodeData => {
    switch (activeTab) {
      case 'scene': return SCENE_NODE_DATA
      case 'character': return CHARACTER_NODE_DATA
      case 'props': return PROPS_NODE_DATA
      default: return SCENE_NODE_DATA
    }
  }, [activeTab])

  const nodeData = getNodeData()
  const themeColor = NODE_COLORS[activeTab]

  const toggleOption = useCallback((categoryKey: string, optionId: string) => {
    setSelectedOptions(prev => {
      const currentSelected = prev[categoryKey] || []
      const isSelected = currentSelected.includes(optionId)

      return {
        ...prev,
        [categoryKey]: isSelected
          ? currentSelected.filter(id => id !== optionId)
          : [...currentSelected, optionId]
      }
    })
  }, [])

  const combinedPrompt = useMemo(() => {
    const parts: string[] = []

    if (userPrompt.trim()) {
      parts.push(userPrompt.trim())
    }

    Object.entries(selectedOptions).forEach(([categoryKey, optionIds]) => {
      const category = nodeData[categoryKey]
      if (category) {
        optionIds.forEach(optionId => {
          const option = category.options.find(opt => opt.id === optionId)
          if (option) {
            parts.push(option.prompt)
          }
        })
      }
    })

    return parts.join(', ')
  }, [userPrompt, selectedOptions, nodeData])

  const totalSelected = useMemo(() => {
    return Object.values(selectedOptions).reduce((sum, arr) => sum + arr.length, 0)
  }, [selectedOptions])

  const handleApply = () => {
    if (combinedPrompt) {
      onPromptGenerated(combinedPrompt)
    }
  }

  const handleClear = () => {
    setSelectedOptions({})
    setUserPrompt('')
  }

  return (
    <div className="prompt-node-panel">
      <div className="prompt-node-header">
        <h3>프롬프트 노드</h3>
        <button className="prompt-node-close" onClick={onClose}>×</button>
      </div>

      {/* 탭 */}
      <div className="prompt-node-tabs">
        <button
          className={`prompt-tab ${activeTab === 'scene' ? 'active' : ''}`}
          style={{ '--tab-color': NODE_COLORS.scene } as React.CSSProperties}
          onClick={() => setActiveTab('scene')}
        >
          🎬 장면
        </button>
        <button
          className={`prompt-tab ${activeTab === 'character' ? 'active' : ''}`}
          style={{ '--tab-color': NODE_COLORS.character } as React.CSSProperties}
          onClick={() => setActiveTab('character')}
        >
          🧑 캐릭터
        </button>
        <button
          className={`prompt-tab ${activeTab === 'props' ? 'active' : ''}`}
          style={{ '--tab-color': NODE_COLORS.props } as React.CSSProperties}
          onClick={() => setActiveTab('props')}
        >
          🎒 소품
        </button>
      </div>

      {/* 프롬프트 입력 */}
      <div className="prompt-input-section">
        <label>기본 프롬프트</label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="생성할 이미지 설명..."
          rows={2}
        />
      </div>

      {/* 노드 카테고리들 */}
      <div className="prompt-node-categories">
        {Object.entries(nodeData).map(([categoryKey, category]) => (
          <div key={categoryKey} className="prompt-category">
            <div className="prompt-category-header">
              <span>{category.title}</span>
              <span className="prompt-category-count">
                {(selectedOptions[categoryKey] || []).length}개
              </span>
            </div>
            <div className="prompt-options">
              {category.options.map(option => {
                const isSelected = (selectedOptions[categoryKey] || []).includes(option.id)
                return (
                  <button
                    key={option.id}
                    className={`prompt-option ${isSelected ? 'selected' : ''}`}
                    style={{
                      '--option-color': themeColor,
                      borderColor: isSelected ? themeColor : '#ddd',
                      backgroundColor: isSelected ? `${themeColor}15` : '#fff',
                      color: isSelected ? themeColor : '#666',
                    } as React.CSSProperties}
                    onClick={() => toggleOption(categoryKey, option.id)}
                  >
                    {isSelected && <span className="check">✓</span>}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 조합된 프롬프트 미리보기 */}
      {combinedPrompt && (
        <div className="prompt-preview" style={{ borderColor: themeColor }}>
          <label style={{ color: themeColor }}>📝 조합된 프롬프트</label>
          <p>{combinedPrompt}</p>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="prompt-node-footer">
        <span className="prompt-selected-count">{totalSelected}개 선택됨</span>
        <div className="prompt-actions">
          <button className="prompt-clear-btn" onClick={handleClear}>초기화</button>
          <button
            className="prompt-apply-btn"
            onClick={handleApply}
            disabled={!combinedPrompt}
            style={{ backgroundColor: themeColor }}
          >
            프롬프트 적용
          </button>
        </div>
      </div>
    </div>
  )
}
