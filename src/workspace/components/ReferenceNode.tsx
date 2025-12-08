import { useState, useEffect, useRef, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { ReferenceNodeData, ReferenceType } from '../types'
import { REFERENCE_NODE_CONFIG } from '../config/node-configs'

export function ReferenceNode({ data, selected, id }: NodeProps<ReferenceNodeData>) {
  const [referenceType, setReferenceType] = useState<ReferenceType>(data.referenceType || 'pose')
  const [image, setImage] = useState(data.image || '')
  const [strength, setStrength] = useState(data.strength || 0.8)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  const defaultConfig = { title: '이미지 참조', color: '#4CAF50', options: [] }
  const config = REFERENCE_NODE_CONFIG[referenceType] || REFERENCE_NODE_CONFIG.pose || defaultConfig
  const themeColor = config?.color || '#4CAF50'

  // 컨텐츠에 따른 노드 높이 계산
  const calculatedHeight = useMemo(() => {
    let height = 200 // 기본 높이 (헤더, 타입 선택)
    height += 150 // 이미지 드롭존
    if (image) height += 60 // 참조 강도 슬라이더
    const optionsCount = config?.options?.length || 0
    if (optionsCount > 0) {
      const rows = Math.ceil(optionsCount / 2) // 2열 기준
      height += rows * 36 + 20 // 옵션 버튼들
    }
    return Math.max(300, Math.min(height, 600))
  }, [image, config?.options?.length])

  // 노드 크기 자동 조절
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          const currentHeight = (n.style?.height as number) || 300
          if (Math.abs(currentHeight - calculatedHeight) > 30) {
            return { ...n, style: { ...n.style, height: calculatedHeight } }
          }
        }
        return n
      })
    )
  }, [calculatedHeight, id, setNodes])

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, referenceType, image, strength, selectedOptions } }
        }
        return n
      })
    )
  }, [referenceType, image, strength, selectedOptions, id, setNodes])

  const handleTypeChange = (newType: ReferenceType) => {
    setReferenceType(newType)
    setSelectedOptions([])
  }

  const toggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((i) => i !== optId) : [...prev, optId]
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      className={`reference-node ${selected ? 'selected' : ''}`}
      style={{ '--ref-color': themeColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Left} id="ref-in" />
      <NodeResizer isVisible={selected} minWidth={260} minHeight={300} />

      <div className="ref-node-header" style={{ backgroundColor: themeColor }}>
        <span>🖼️ 이미지 참조</span>
      </div>

      <div className="ref-node-content ref-scrollable nodrag" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ref-type-selector">
          <label>참조 타입</label>
          <select
            className="nodrag"
            value={referenceType}
            onChange={(e) => handleTypeChange(e.target.value as ReferenceType)}
            style={{ borderColor: themeColor }}
          >
            <option value="pose">🏃 포즈</option>
            <option value="character">👤 캐릭터</option>
            <option value="style">🎨 스타일</option>
            <option value="composition">📐 구도</option>
            <option value="background">🏞️ 배경</option>
            <option value="object">📦 오브젝트</option>
          </select>
        </div>

        <div
          className={`ref-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !image && fileInputRef.current?.click()}
          style={{ borderColor: isDragging ? themeColor : '#ddd' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {image ? (
            <>
              <img src={image} alt="Reference" className="ref-preview-img" draggable={false} />
              <button
                className="ref-remove-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setImage('')
                }}
              >
                ×
              </button>
            </>
          ) : (
            <>
              <span className="ref-drop-icon">📥</span>
              <span className="ref-drop-text">이미지 드롭 또는 클릭</span>
            </>
          )}
        </div>

        {image && (
          <div className="ref-strength">
            <div className="ref-strength-label">
              <span>참조 강도</span>
              <span>{Math.round(strength * 100)}%</span>
            </div>
            <input
              className="nodrag"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={strength}
              onChange={(e) => setStrength(parseFloat(e.target.value))}
              style={{ accentColor: themeColor }}
            />
          </div>
        )}

        <div className="ref-options">
          {(config?.options || []).map((opt) => (
            <button
              key={opt.id}
              className={`ref-opt-btn ${selectedOptions.includes(opt.id) ? 'active' : ''}`}
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

      <Handle type="source" position={Position.Right} id="ref-out" />
    </div>
  )
}
