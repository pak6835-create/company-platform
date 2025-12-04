import { useState, useEffect, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { PostProcessNodeData, ProcessType } from '../types'
import { POSTPROCESS_NODE_CONFIG } from '../config/node-configs'

export function PostProcessNode({ data, selected, id }: NodeProps<PostProcessNodeData>) {
  const [processType, setProcessType] = useState<ProcessType>(data.processType || 'removeBackground')
  const [intensity, setIntensity] = useState(data.intensity || 1.0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])
  const [inputImage, setInputImage] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { setNodes } = useReactFlow()

  // 연결된 노드에서 이미지 가져오기
  const edges = useStore((s) => s.edges || [])
  const nodes = useStore((s) => s.nodes || [])

  // AI 생성기에서 연결된 이미지 찾기
  const connectedImage = useMemo(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) return null

    const sourceEdge = edges.find((e) => e && e.target === id)
    if (!sourceEdge) return null

    const sourceNode = nodes.find((n) => n && n.id === sourceEdge.source)
    if (!sourceNode) return null

    // AI 생성기 노드에서 최근 생성 이미지 가져오기
    if (sourceNode.type === 'aiGenerator') {
      return sourceNode.data?.lastGeneratedImage || null
    }
    // 이미지 노드에서 이미지 가져오기
    if (sourceNode.type === 'image') {
      return sourceNode.data?.image || null
    }
    return null
  }, [edges, nodes, id])

  useEffect(() => {
    if (connectedImage) {
      setInputImage(connectedImage)
    }
  }, [connectedImage])

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

        {/* 입력 이미지 미리보기 */}
        {inputImage && (
          <div className="pp-image-preview">
            <label>📥 입력 이미지</label>
            <img src={inputImage} alt="Input" />
          </div>
        )}

        {/* 처리 버튼 */}
        <button
          className="pp-process-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (!inputImage) return
            setIsProcessing(true)
            // 후처리 시뮬레이션 (실제 처리는 별도 API 연동 필요)
            setTimeout(() => {
              setOutputImage(inputImage) // 현재는 원본 유지
              setIsProcessing(false)
            }, 1000)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={!inputImage || isProcessing}
          style={{ backgroundColor: themeColor }}
        >
          {isProcessing ? '처리 중...' : '✨ 후처리 적용'}
        </button>

        {/* 출력 이미지 미리보기 */}
        {outputImage && (
          <div className="pp-image-preview output">
            <label>📤 출력 이미지</label>
            <img src={outputImage} alt="Output" />
            <button
              className="pp-download-btn"
              onClick={(e) => {
                e.stopPropagation()
                const link = document.createElement('a')
                link.href = outputImage
                link.download = `processed-${Date.now()}.png`
                link.click()
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              ⬇️ 다운로드
            </button>
          </div>
        )}

        {!inputImage && (
          <div className="pp-help">💡 AI 생성기나 이미지 노드를 연결하세요</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="pp-out" />
    </div>
  )
}
