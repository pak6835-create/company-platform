import { useState, useEffect } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { PostProcessNodeData, ProcessType } from '../types'
import { POSTPROCESS_NODE_CONFIG } from '../config/node-configs'

export function PostProcessNode({ data, selected, id }: NodeProps<PostProcessNodeData>) {
  const [processType, setProcessType] = useState<ProcessType>(data.processType || 'removeBackground')
  const [intensity, setIntensity] = useState(data.intensity || 1.0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])
  const { setNodes } = useReactFlow()

  const defaultConfig = { title: '후처리', color: '#E91E63', options: [] }
  const config = POSTPROCESS_NODE_CONFIG[processType] || POSTPROCESS_NODE_CONFIG.removeBackground || defaultConfig
  const themeColor = config?.color || '#E91E63'

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, processType, intensity, selectedOptions } }
        }
        return n
      })
    )
  }, [processType, intensity, selectedOptions, id, setNodes])

  const handleTypeChange = (newType: ProcessType) => {
    setProcessType(newType)
    setSelectedOptions([])
  }

  const toggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((i) => i !== optId) : [...prev, optId]
    )
  }

  return (
    <div
      className={`postprocess-node ${selected ? 'selected' : ''}`}
      style={{ '--pp-color': themeColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Left} id="pp-in" />
      <NodeResizer isVisible={selected} minWidth={260} minHeight={220} />

      <div className="pp-node-header" style={{ backgroundColor: themeColor }}>
        <span>✨ 후처리</span>
      </div>

      <div className="pp-node-content pp-scrollable nodrag" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pp-type-selector">
          <label>후처리 타입</label>
          <select
            className="nodrag"
            value={processType}
            onChange={(e) => handleTypeChange(e.target.value as ProcessType)}
            style={{ borderColor: themeColor }}
          >
            <option value="removeBackground">🔲 배경 제거</option>
            <option value="extractLine">✏️ 라인 추출</option>
            <option value="materialID">🏷️ 재질맵</option>
            <option value="upscale">🔍 업스케일</option>
            <option value="stylize">✨ 스타일 변환</option>
          </select>
        </div>

        <div className="pp-intensity">
          <div className="pp-intensity-label">
            <span>적용 강도</span>
            <span>{Math.round(intensity * 100)}%</span>
          </div>
          <input
            className="nodrag"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            style={{ accentColor: themeColor }}
          />
        </div>

        <div className="pp-options">
          {(config?.options || []).map((opt) => (
            <button
              key={opt.id}
              className={`pp-opt-btn ${selectedOptions.includes(opt.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleOption(opt.id)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                borderColor: selectedOptions.includes(opt.id) ? themeColor : '#ddd',
                backgroundColor: selectedOptions.includes(opt.id) ? `${themeColor}20` : '#fff',
                color: selectedOptions.includes(opt.id) ? themeColor : '#666',
              }}
            >
              {selectedOptions.includes(opt.id) && '✓ '}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="pp-out" />
    </div>
  )
}
