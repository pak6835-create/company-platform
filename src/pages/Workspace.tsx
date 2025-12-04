import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  Connection,
  NodeResizer,
  Handle,
  Position,
  NodeProps,
  useStore,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Workspace.css'
import { SCENE_NODE_DATA, CHARACTER_NODE_DATA, PROPS_NODE_DATA, NODE_COLORS } from '../components/nodes/node-data'

// 타입 정의
interface Board {
  id: string
  name: string
  parentId: string | null
  nodes: Node[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}

interface WorkspaceData {
  boards: { [key: string]: Board }
  currentBoardId: string
  tray: TrayItem[]
}

// 트레이 아이템 타입
interface TrayItem {
  id: string
  type: 'image' | 'note' | 'text' | 'shape' | 'board'
  data: ImageNodeData | NoteNodeData | TextNodeData | ShapeNodeData | BoardNodeData
  createdAt: number
}

// 노드 데이터 타입들
interface ImageNodeData {
  imageUrl: string
  label: string
  width?: number
  height?: number
}

interface NoteNodeData {
  content: string
  backgroundColor?: string
}

interface TextNodeData {
  text: string
  fontSize?: number
  color?: string
}

interface ShapeNodeData {
  shape: 'rectangle' | 'circle' | 'triangle'
  backgroundColor?: string
  width?: number
  height?: number
}

interface BoardNodeData {
  boardId: string
  name: string
  color?: string
  itemCount?: number
  onNameChange?: (boardId: string, newName: string) => void
}

// AI 생성기 노드 데이터
interface AIGeneratorNodeData {
  apiKey?: string
  model?: string
  prompt?: string
  onGenerate?: (imageUrl: string, label: string) => void
  // 연결된 노드에서 받은 데이터
  connectedPrompt?: string
  connectedReferences?: { type: string; image: string; strength: number }[]
}

// 프롬프트 노드 데이터
interface PromptBuilderNodeData {
  combinedPrompt?: string
  onPromptChange?: (prompt: string) => void
}

// 참조 노드 데이터
interface ReferenceNodeData {
  referenceType: 'pose' | 'character' | 'style' | 'composition' | 'background' | 'object'
  image?: string
  strength?: number
  selectedOptions?: string[]
}

// 후처리 노드 데이터
interface PostProcessNodeData {
  processType: 'removeBackground' | 'extractLine' | 'materialID' | 'upscale' | 'stylize'
  intensity?: number
  selectedOptions?: string[]
}

// 커스텀 이미지 노드
function ImageNode({ data, selected, id }: NodeProps<ImageNodeData>) {
  const { setNodes } = useReactFlow()

  const onResize = useCallback((_event: unknown, params: { width: number; height: number }) => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, width: params.width, height: params.height } }
      }
      return n
    }))
  }, [id, setNodes])

  return (
    <div className={`image-node ${selected ? 'selected' : ''}`} style={{ width: '100%', height: '100%' }}>
      <Handle type="target" position={Position.Left} />
      <NodeResizer isVisible={selected} minWidth={100} minHeight={100} keepAspectRatio onResize={onResize} />
      <div className="image-content">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.label} className="image-thumbnail" draggable={false} />
        ) : (
          <div className="image-loading">Loading...</div>
        )}
      </div>
      <div className="image-label">{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// 커스텀 노트 노드
function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  return (
    <div className={`note-node ${selected ? 'selected' : ''}`} style={{ backgroundColor: data.backgroundColor || '#fef3c7', width: '100%', height: '100%' }}>
      <Handle type="target" position={Position.Left} />
      <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
      <div className="note-content">{data.content}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// 텍스트 노드
function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  return (
    <div className={`text-node ${selected ? 'selected' : ''}`} style={{ width: '100%', height: '100%' }}>
      <Handle type="target" position={Position.Left} />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={30} />
      <div
        className="text-content"
        style={{ fontSize: data.fontSize || 16, color: data.color || '#374151' }}
      >
        {data.text}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// 도형 노드
function ShapeNode({ data, selected, id }: NodeProps<ShapeNodeData>) {
  const shapeClass = `shape-node shape-${data.shape}`
  const { setNodes } = useReactFlow()

  const onResize = useCallback((_event: unknown, params: { width: number; height: number }) => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, width: params.width, height: params.height } }
      }
      return n
    }))
  }, [id, setNodes])

  return (
    <div
      className={`${shapeClass} ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.backgroundColor || '#3b82f6',
        width: '100%',
        height: '100%'
      }}
    >
      <Handle type="target" position={Position.Left} />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={50} onResize={onResize} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// AI 생성기 노드 (캔버스에 배치되는 카드형) - 연결 기능 포함
function AIGeneratorNode({ data, selected, id }: NodeProps<AIGeneratorNodeData>) {
  const [localApiKey, setLocalApiKey] = useState(data.apiKey || '')
  const [localModel, setLocalModel] = useState(data.model || 'gemini-2.0-flash-exp')
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState('')

  // ReactFlow에서 edges와 nodes 가져오기
  const edges = useStore((state) => state.edges)
  const nodes = useStore((state) => state.nodes)

  // 이 노드에 연결된 소스 노드들 찾기
  const connectedSources = edges
    .filter(edge => edge.target === id)
    .map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      return sourceNode
    })
    .filter(Boolean)

  // 연결된 프롬프트 빌더에서 프롬프트 가져오기
  const connectedPrompts = connectedSources
    .filter(node => node?.type === 'promptBuilder')
    .map(node => node?.data?.combinedPrompt)
    .filter(Boolean)
    .join(', ')

  // 연결된 참조 노드들
  const connectedRefs = connectedSources
    .filter(node => node?.type === 'reference')
    .map(node => ({
      type: node?.data?.referenceType,
      hasImage: !!node?.data?.image,
      strength: node?.data?.strength || 0.8,
    }))

  // 최종 프롬프트 (직접 입력 + 연결된 프롬프트)
  const getFinalPrompt = () => {
    const parts = []
    if (localPrompt.trim()) parts.push(localPrompt.trim())
    if (connectedPrompts) parts.push(connectedPrompts)
    return parts.join(', ')
  }

  const handleGenerate = async () => {
    const finalPrompt = getFinalPrompt()
    if (!localApiKey || !finalPrompt) {
      setError('API 키와 프롬프트를 입력하세요')
      return
    }
    setIsGenerating(true)
    setError('')

    try {
      const isProduction = window.location.hostname !== 'localhost'
      const endpoint = isProduction
        ? '/.netlify/functions/generate'
        : `/api/gemini/v1beta/models/${localModel}:generateContent?key=${localApiKey}`

      const body = isProduction
        ? JSON.stringify({ prompt: finalPrompt, apiKey: localApiKey, model: localModel })
        : JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
          })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error.message || result.error)

      const imagePart = result.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { data: string } }) => p.inlineData?.data
      )
      if (!imagePart) throw new Error('이미지 생성 실패')

      const imageUrl = 'data:image/png;base64,' + imagePart.inlineData.data
      if (data.onGenerate) {
        data.onGenerate(imageUrl, finalPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasConnections = connectedSources.length > 0

  return (
    <div className={`ai-generator-node ${selected ? 'selected' : ''} ${hasConnections ? 'has-connections' : ''}`}>
      <Handle type="target" position={Position.Left} id="prompt-in" />
      <NodeResizer isVisible={selected} minWidth={300} minHeight={200} />

      <div className="ai-node-header">
        <span>🤖 AI 이미지 생성기</span>
        {hasConnections && <span className="connection-badge">🔗 {connectedSources.length}</span>}
      </div>

      <div className="ai-node-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {/* 연결 상태 표시 */}
        {hasConnections && (
          <div className="ai-node-connections">
            <div className="connections-title">📥 연결된 노드:</div>
            {connectedPrompts && (
              <div className="connection-item prompt-connection">
                <span className="conn-icon">🎨</span>
                <span className="conn-label">프롬프트 빌더</span>
                <span className="conn-status">✓</span>
              </div>
            )}
            {connectedRefs.map((ref, i) => (
              <div key={i} className={`connection-item ref-connection ${ref.hasImage ? 'has-image' : ''}`}>
                <span className="conn-icon">🖼️</span>
                <span className="conn-label">{ref.type} 참조</span>
                <span className="conn-status">{ref.hasImage ? '✓' : '⚠️'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ai-node-field">
          <label>API 키</label>
          <div className="ai-node-input-row">
            <input
              className="nodrag"
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="AIza..."
            />
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? '숨김' : '보기'}
            </button>
          </div>
        </div>

        <div className="ai-node-field">
          <label>모델</label>
          <select className="nodrag" value={localModel} onChange={(e) => setLocalModel(e.target.value)}>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
            <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro</option>
          </select>
        </div>

        <div className="ai-node-field">
          <label>추가 프롬프트 {connectedPrompts && '(연결됨)'}</label>
          <textarea
            className="nodrag"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            placeholder={connectedPrompts ? "연결된 프롬프트에 추가할 내용..." : "생성할 이미지 설명..."}
            rows={2}
          />
        </div>

        {/* 최종 프롬프트 미리보기 */}
        {getFinalPrompt() && (
          <div className="ai-node-preview">
            <label>📝 최종 프롬프트</label>
            <p>{getFinalPrompt().length > 100 ? getFinalPrompt().slice(0, 100) + '...' : getFinalPrompt()}</p>
          </div>
        )}

        {error && <div className="ai-node-error">{error}</div>}

        <button
          className="ai-node-generate-btn"
          onClick={handleGenerate}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isGenerating || !getFinalPrompt()}
        >
          {isGenerating ? '⏳ 생성 중...' : '✨ 이미지 생성'}
        </button>

        {!hasConnections && (
          <div className="ai-node-help">
            💡 왼쪽 핸들에 프롬프트 빌더나 참조 노드를 연결하세요
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}

// 기존 node-data.ts의 풍부한 데이터 (컴포넌트 외부에 정의)
const FULL_NODE_DATA = {
  scene: SCENE_NODE_DATA,
  character: CHARACTER_NODE_DATA,
  props: PROPS_NODE_DATA,
}

// 프롬프트 빌더 노드 (캔버스에 배치되는 카드형) - 전체 데이터 사용
function PromptBuilderNode({ data, selected, id }: NodeProps<PromptBuilderNodeData>) {
  const [activeTab, setActiveTab] = useState<'scene' | 'character' | 'props'>('scene')
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({})
  const [userPrompt, setUserPrompt] = useState('')
  const { setNodes } = useReactFlow()

  const currentData = FULL_NODE_DATA[activeTab]
  const themeColor = NODE_COLORS[activeTab]

  const toggleOption = useCallback((catKey: string, optId: string) => {
    setSelectedOptions(prev => {
      const curr = prev[catKey] || []
      return {
        ...prev,
        [catKey]: curr.includes(optId) ? curr.filter(i => i !== optId) : [...curr, optId]
      }
    })
  }, [])

  // 모든 탭에서 선택된 옵션으로 프롬프트 조합
  const getCombinedPrompt = useCallback(() => {
    const parts: string[] = []
    if (userPrompt.trim()) parts.push(userPrompt.trim())

    // 모든 탭의 데이터를 순회
    Object.entries(FULL_NODE_DATA).forEach(([, tabData]) => {
      Object.entries(tabData).forEach(([catKey, category]) => {
        const selectedIds = selectedOptions[catKey] || []
        selectedIds.forEach(optId => {
          const opt = category.options.find(o => o.id === optId)
          if (opt) parts.push(opt.prompt)
        })
      })
    })

    return parts.join(', ')
  }, [selectedOptions, userPrompt])

  // 선택된 총 옵션 수
  const totalSelected = Object.values(selectedOptions).reduce((sum, arr) => sum + arr.length, 0)

  // 프롬프트가 변경될 때마다 노드 데이터 업데이트 (ref 사용으로 무한루프 방지)
  const combinedPrompt = getCombinedPrompt()
  const prevPromptRef = useRef<string>('')

  useEffect(() => {
    if (prevPromptRef.current !== combinedPrompt) {
      prevPromptRef.current = combinedPrompt
      setNodes(nds => nds.map(n => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, combinedPrompt } }
        }
        return n
      }))
    }
  }, [combinedPrompt, id, setNodes])

  const handleClear = () => {
    setSelectedOptions({})
    setUserPrompt('')
  }

  return (
    <div className={`prompt-builder-node ${selected ? 'selected' : ''}`} style={{ '--prompt-color': themeColor } as React.CSSProperties}>
      <NodeResizer isVisible={selected} minWidth={340} minHeight={320} />

      <div className="prompt-node-header" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)` }}>
        <span>🎨 프롬프트 빌더</span>
        <span className="prompt-header-count">{totalSelected}개 선택</span>
      </div>

      <div className="prompt-node-tabs">
        <button
          className={activeTab === 'scene' ? 'active' : ''}
          onClick={() => setActiveTab('scene')}
          style={{ '--tab-color': NODE_COLORS.scene } as React.CSSProperties}
        >
          🎬 장면
        </button>
        <button
          className={activeTab === 'character' ? 'active' : ''}
          onClick={() => setActiveTab('character')}
          style={{ '--tab-color': NODE_COLORS.character } as React.CSSProperties}
        >
          🧑 캐릭터
        </button>
        <button
          className={activeTab === 'props' ? 'active' : ''}
          onClick={() => setActiveTab('props')}
          style={{ '--tab-color': NODE_COLORS.props } as React.CSSProperties}
        >
          🎒 소품
        </button>
      </div>

      <div className="prompt-node-body" onMouseDown={(e) => e.stopPropagation()}>
        <input
          type="text"
          className="prompt-node-input nodrag"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="기본 프롬프트 입력..."
        />

        <div className="prompt-node-categories nodrag">
          {Object.entries(currentData).map(([catKey, category]) => (
            <div key={catKey} className="prompt-mini-category">
              <div className="prompt-cat-header">
                <span className="prompt-cat-title">{category.title}</span>
                <span className="prompt-cat-count">{(selectedOptions[catKey] || []).length}개</span>
              </div>
              <div className="prompt-cat-options">
                {category.options.map(opt => {
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
              <span style={{ color: themeColor }}>📝 조합된 프롬프트</span>
              <button className="clear-btn" onClick={handleClear} onMouseDown={(e) => e.stopPropagation()}>초기화</button>
            </div>
            <p className="preview-text">{combinedPrompt}</p>
          </div>
        )}

        <div className="prompt-node-help">
          💡 AI 생성기 노드의 왼쪽 핸들에 연결하세요
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="prompt-out" />
    </div>
  )
}

// 참조 노드 데이터
const REFERENCE_NODE_CONFIG = {
  pose: { title: '🏃 포즈 참조', color: '#4CAF50', options: [
    { id: 'pose_exact', label: '정확히', prompt: 'exact same pose as reference' },
    { id: 'pose_similar', label: '비슷하게', prompt: 'similar pose to reference' },
    { id: 'pose_mirror', label: '좌우반전', prompt: 'mirrored pose from reference' },
  ]},
  character: { title: '👤 캐릭터 참조', color: '#2196F3', options: [
    { id: 'char_same', label: '동일인물', prompt: 'same character, consistent appearance' },
    { id: 'char_outfit', label: '의상만변경', prompt: 'same character, different outfit' },
    { id: 'char_emotion', label: '표정만변경', prompt: 'same character, different expression' },
  ]},
  style: { title: '🎨 스타일 참조', color: '#9C27B0', options: [
    { id: 'style_exact', label: '동일스타일', prompt: 'exact same art style as reference' },
    { id: 'style_color', label: '색감만', prompt: 'same color palette as reference' },
    { id: 'style_lineart', label: '선스타일', prompt: 'same line art style as reference' },
  ]},
  composition: { title: '📐 구도 참조', color: '#FF9800', options: [
    { id: 'comp_exact', label: '동일구도', prompt: 'exact same composition as reference' },
    { id: 'comp_layout', label: '레이아웃만', prompt: 'same layout as reference' },
    { id: 'comp_perspective', label: '원근법', prompt: 'same perspective as reference' },
  ]},
  background: { title: '🏞️ 배경 참조', color: '#00BCD4', options: [
    { id: 'bg_same', label: '동일배경', prompt: 'exact same background as reference' },
    { id: 'bg_time', label: '시간만변경', prompt: 'same background, different time of day' },
    { id: 'bg_weather', label: '날씨만변경', prompt: 'same background, different weather' },
  ]},
  object: { title: '📦 오브젝트 참조', color: '#795548', options: [
    { id: 'obj_same', label: '동일물체', prompt: 'exact same object as reference' },
    { id: 'obj_style', label: '스타일만', prompt: 'same object style as reference' },
    { id: 'obj_angle', label: '각도변경', prompt: 'same object from different angle' },
  ]},
}

// 참조 노드 컴포넌트
function ReferenceNode({ data, selected, id }: NodeProps<ReferenceNodeData>) {
  const [image, setImage] = useState(data.image || '')
  const [strength, setStrength] = useState(data.strength || 0.8)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  const config = REFERENCE_NODE_CONFIG[data.referenceType] || REFERENCE_NODE_CONFIG.pose
  const themeColor = config.color

  // 데이터가 변경될 때마다 노드에 저장
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, image, strength, selectedOptions } }
      }
      return n
    }))
  }, [image, strength, selectedOptions, id, setNodes])

  const toggleOption = (optId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optId) ? prev.filter(i => i !== optId) : [...prev, optId]
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
    <div className={`reference-node ${selected ? 'selected' : ''}`} style={{ '--ref-color': themeColor } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} id="ref-in" />
      <NodeResizer isVisible={selected} minWidth={260} minHeight={200} />

      <div className="ref-node-header" style={{ backgroundColor: themeColor }}>
        <span>{config.title}</span>
      </div>

      <div className="ref-node-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {/* 이미지 드롭존 */}
        <div
          className={`ref-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
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
              <button className="ref-remove-btn" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setImage('') }}>×</button>
            </>
          ) : (
            <>
              <span className="ref-drop-icon">📥</span>
              <span className="ref-drop-text">이미지 드롭 또는 클릭</span>
            </>
          )}
        </div>

        {/* 참조 강도 슬라이더 */}
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

        {/* 옵션 버튼들 */}
        <div className="ref-options">
          {config.options.map(opt => (
            <button
              key={opt.id}
              className={`ref-opt-btn ${selectedOptions.includes(opt.id) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleOption(opt.id) }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                borderColor: selectedOptions.includes(opt.id) ? themeColor : '#ddd',
                backgroundColor: selectedOptions.includes(opt.id) ? `${themeColor}20` : '#fff',
                color: selectedOptions.includes(opt.id) ? themeColor : '#666',
              }}
            >
              {selectedOptions.includes(opt.id) && '✓ '}{opt.label}
            </button>
          ))}
        </div>

        <div className="ref-node-help">
          💡 오른쪽 핸들을 AI 생성기에 연결하세요
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="ref-out" />
    </div>
  )
}

// 후처리 노드 데이터
const POSTPROCESS_NODE_CONFIG = {
  removeBackground: { title: '🔲 배경 제거', color: '#E91E63', options: [
    { id: 'bg_auto', label: '자동감지', prompt: 'automatic background removal' },
    { id: 'bg_subject', label: '주요피사체', prompt: 'keep main subject only' },
    { id: 'bg_soft', label: '부드러운엣지', prompt: 'soft edge background removal' },
  ]},
  extractLine: { title: '✏️ 라인 추출', color: '#607D8B', options: [
    { id: 'line_thin', label: '가는선', prompt: 'thin line art extraction' },
    { id: 'line_medium', label: '중간선', prompt: 'medium line art extraction' },
    { id: 'line_thick', label: '굵은선', prompt: 'thick line art extraction' },
  ]},
  materialID: { title: '🏷️ 재질맵', color: '#9C27B0', options: [
    { id: 'mat_skin', label: '피부', prompt: 'skin material separation' },
    { id: 'mat_hair', label: '머리카락', prompt: 'hair material separation' },
    { id: 'mat_cloth', label: '옷', prompt: 'clothing material separation' },
  ]},
  upscale: { title: '🔍 업스케일', color: '#2196F3', options: [
    { id: 'up_2x', label: '2배', prompt: '2x upscale' },
    { id: 'up_4x', label: '4배', prompt: '4x upscale' },
    { id: 'up_detail', label: '디테일강화', prompt: 'detail enhancement upscale' },
  ]},
  stylize: { title: '✨ 스타일 변환', color: '#FF9800', options: [
    { id: 'sty_anime', label: '애니메이션', prompt: 'convert to anime style' },
    { id: 'sty_watercolor', label: '수채화', prompt: 'convert to watercolor style' },
    { id: 'sty_pixel', label: '픽셀', prompt: 'convert to pixel art' },
  ]},
}

// 후처리 노드 컴포넌트
function PostProcessNode({ data, selected }: NodeProps<PostProcessNodeData>) {
  const [intensity, setIntensity] = useState(data.intensity || 1.0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])

  const config = POSTPROCESS_NODE_CONFIG[data.processType] || POSTPROCESS_NODE_CONFIG.removeBackground
  const themeColor = config.color

  const toggleOption = (optId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    )
  }

  return (
    <div className={`postprocess-node ${selected ? 'selected' : ''}`} style={{ '--pp-color': themeColor } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} id="pp-in" />
      <NodeResizer isVisible={selected} minWidth={240} minHeight={160} />

      <div className="pp-node-header" style={{ backgroundColor: themeColor }}>
        <span>{config.title}</span>
      </div>

      <div className="pp-node-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {/* 강도 슬라이더 */}
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

        {/* 옵션 버튼들 */}
        <div className="pp-options">
          {config.options.map(opt => (
            <button
              key={opt.id}
              className={`pp-opt-btn ${selectedOptions.includes(opt.id) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleOption(opt.id) }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                borderColor: selectedOptions.includes(opt.id) ? themeColor : '#ddd',
                backgroundColor: selectedOptions.includes(opt.id) ? `${themeColor}20` : '#fff',
                color: selectedOptions.includes(opt.id) ? themeColor : '#666',
              }}
            >
              {selectedOptions.includes(opt.id) && '✓ '}{opt.label}
            </button>
          ))}
        </div>

        {/* 상태 표시 */}
        <div className="pp-status">
          {selectedOptions.length}개 옵션 선택됨
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="pp-out" />
    </div>
  )
}

// 보드 노드 (심플한 폴더 아이콘) - 더블클릭으로 진입
function BoardNode({ data, selected }: NodeProps<BoardNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(data.name || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(data.name || '')
    setIsEditing(true)
  }

  const handleNameChange = () => {
    setIsEditing(false)
    if (data.onNameChange) {
      data.onNameChange(data.boardId, editName.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameChange()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(data.name || '')
    }
  }

  return (
    <div className={`board-node ${selected ? 'selected' : ''}`}>
      <div className="board-node-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="board-node-input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameChange}
          onKeyDown={handleKeyDown}
          placeholder="보드 이름"
        />
      ) : (
        <div
          className="board-node-name"
          onDoubleClick={handleNameDoubleClick}
        >
          {data.name || '새 보드'}
        </div>
      )}
      {data.itemCount !== undefined && data.itemCount > 0 && (
        <div className="board-node-count">{data.itemCount}</div>
      )}
    </div>
  )
}

const nodeTypes = {
  image: ImageNode,
  note: NoteNode,
  text: TextNode,
  shape: ShapeNode,
  board: BoardNode,
  aiGenerator: AIGeneratorNode,
  promptBuilder: PromptBuilderNode,
  reference: ReferenceNode,
  postProcess: PostProcessNode,
}

// 노트 색상 옵션
const noteColors = [
  { name: '노랑', color: '#fef3c7' },
  { name: '파랑', color: '#dbeafe' },
  { name: '초록', color: '#dcfce7' },
  { name: '분홍', color: '#fce7f3' },
  { name: '보라', color: '#ede9fe' },
]

// 도형 색상 옵션
const shapeColors = [
  { name: '파랑', color: '#3b82f6' },
  { name: '빨강', color: '#ef4444' },
  { name: '초록', color: '#22c55e' },
  { name: '노랑', color: '#eab308' },
  { name: '보라', color: '#a855f7' },
  { name: '회색', color: '#6b7280' },
]


// 로컬 스토리지 키
const STORAGE_KEY = 'workspace_data'

// 초기 데이터 생성
const createInitialData = (): WorkspaceData => ({
  boards: {
    'home': {
      id: 'home',
      name: '홈 보드',
      parentId: null,
      nodes: [
        {
          id: 'welcome-note',
          type: 'note',
          position: { x: 250, y: 100 },
          data: {
            content: '홈 보드에 오신 것을 환영합니다!\n\n여기서 작업을 시작하세요.\n새 보드를 만들어 정리할 수 있습니다.',
            backgroundColor: '#fef3c7',
          },
        },
      ],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  },
  currentBoardId: 'home',
  tray: []
})

// 데이터 로드
const loadWorkspaceData = (): WorkspaceData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      // tray가 없으면 빈 배열로 초기화
      if (!data.tray) data.tray = []
      return data
    }
  } catch (e) {
    console.error('Failed to load workspace data:', e)
  }
  return createInitialData()
}

// 데이터 저장
const saveWorkspaceData = (data: WorkspaceData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save workspace data:', e)
  }
}

function WorkspaceCanvas() {
  const navigate = useNavigate()
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(loadWorkspaceData)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')

  const nodeIdCounter = useRef(Date.now())
  const [showTray, setShowTray] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  // 현재 보드 가져오기
  const currentBoard = workspaceData.boards[workspaceData.currentBoardId]
  const trayItems = workspaceData.tray || []

  // 브레드크럼 경로 생성
  const getBreadcrumbs = useCallback(() => {
    const path: Board[] = []
    let boardId: string | null = workspaceData.currentBoardId

    while (boardId) {
      const board: Board | undefined = workspaceData.boards[boardId]
      if (board) {
        path.unshift(board)
        boardId = board.parentId
      } else {
        break
      }
    }
    return path
  }, [workspaceData])

  // 보드 이름 변경 ref (콜백 순환 참조 방지)
  const boardNameChangeRef = useRef<(boardId: string, newName: string) => void>()
  // 이전 보드 ID 추적 (보드 전환 감지용)
  const prevBoardIdRef = useRef<string | null>(null)

  // 보드 로드 (보드 전환 시 또는 초기 로드 시 실행)
  useEffect(() => {
    // 보드가 전환되었거나 초기 로드일 때만 노드 로드
    if (prevBoardIdRef.current !== workspaceData.currentBoardId) {
      prevBoardIdRef.current = workspaceData.currentBoardId
      if (currentBoard) {
        // 보드 노드의 itemCount와 콜백 업데이트
        const updatedNodes = currentBoard.nodes.map(node => {
          if (node.type === 'board' && node.data.boardId) {
            const targetBoard = workspaceData.boards[node.data.boardId]
            const itemCount = targetBoard ? targetBoard.nodes.length : 0
            return {
              ...node,
              data: {
                ...node.data,
                itemCount,
                onNameChange: (boardId: string, newName: string) => {
                  boardNameChangeRef.current?.(boardId, newName)
                }
              }
            }
          }
          return node
        })
        setNodes(updatedNodes)
        setEdges(currentBoard.edges)
      }
    }
  }, [workspaceData.currentBoardId, currentBoard, workspaceData.boards, setNodes, setEdges])

  // 변경사항 저장 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentBoard) {
        const updatedData = {
          ...workspaceData,
          boards: {
            ...workspaceData.boards,
            [workspaceData.currentBoardId]: {
              ...currentBoard,
              nodes,
              edges,
              updatedAt: Date.now()
            }
          }
        }
        setWorkspaceData(updatedData)
        saveWorkspaceData(updatedData)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nodes, edges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // 보드로 이동
  const navigateToBoard = useCallback((boardId: string) => {
    // 현재 보드 저장
    const updatedData = {
      ...workspaceData,
      boards: {
        ...workspaceData.boards,
        [workspaceData.currentBoardId]: {
          ...currentBoard,
          nodes,
          edges,
          updatedAt: Date.now()
        }
      },
      currentBoardId: boardId
    }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)
  }, [workspaceData, currentBoard, nodes, edges])

  // 노드 더블클릭 핸들러 (보드 진입)
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'board' && node.data.boardId) {
      navigateToBoard(node.data.boardId)
    }
  }, [navigateToBoard])

  // 캔버스에 노드 추가 함수들
  const addImageToCanvas = (imageUrl: string, label: string) => {
    const newNode: Node<ImageNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'image',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { imageUrl, label, width: 300, height: 300 },
      style: { width: 300, height: 300 }
    }
    setNodes((nds) => [...nds, newNode])
  }

  const addNote = (color: string = '#fef3c7') => {
    const newNode: Node<NoteNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'note',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: color },
      style: { width: 200, height: 150 }
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }

  const addText = () => {
    const newNode: Node<TextNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'text',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { text: '텍스트를 입력하세요', fontSize: 16, color: '#374151' },
      style: { width: 150, height: 50 }
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }

  const addShape = (shape: 'rectangle' | 'circle' | 'triangle', color: string = '#3b82f6') => {
    const newNode: Node<ShapeNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'shape',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { shape, backgroundColor: color, width: 100, height: 100 },
      style: { width: 100, height: 100 }
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }

  // 새 보드 생성
  const addBoard = useCallback(() => {
    const boardId = `board-${nodeIdCounter.current++}`

    // 새 보드 데이터 생성
    const newBoard: Board = {
      id: boardId,
      name: '',
      parentId: workspaceData.currentBoardId,
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // 보드 노드 생성
    const newNode: Node<BoardNodeData> = {
      id: `node-${boardId}`,
      type: 'board',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: {
        boardId,
        name: '',
        itemCount: 0,
        onNameChange: (id: string, name: string) => {
          boardNameChangeRef.current?.(id, name)
        }
      }
    }

    // 워크스페이스 데이터 업데이트 (먼저 노드 추가)
    setNodes((nds) => [...nds, newNode])

    // 보드 데이터 업데이트
    const updatedData = {
      ...workspaceData,
      boards: {
        ...workspaceData.boards,
        [boardId]: newBoard
      }
    }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)
    setShowAddPanel(false)
  }, [workspaceData, setNodes])

  // 드래그 앤 드롭 핸들러
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const nodeType = event.dataTransfer.getData('application/reactflow-type')
    const nodeData = event.dataTransfer.getData('application/reactflow-data')

    if (!nodeType || !reactFlowWrapper.current) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    let newNode: Node

    switch (nodeType) {
      case 'aiGenerator':
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'aiGenerator',
          position,
          data: {
            onGenerate: (imageUrl: string, label: string) => {
              addImageToCanvas(imageUrl, label)
            }
          },
          style: { width: 320, height: 400 }
        }
        break
      case 'promptBuilder':
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'promptBuilder',
          position,
          data: {},
          style: { width: 360, height: 450 }
        }
        break
      case 'note':
        const color = nodeData || '#fef3c7'
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'note',
          position,
          data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: color },
          style: { width: 200, height: 150 }
        }
        break
      case 'text':
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'text',
          position,
          data: { text: '텍스트를 입력하세요', fontSize: 16, color: '#374151' },
          style: { width: 150, height: 50 }
        }
        break
      case 'shape':
        const [shape, shapeColor] = (nodeData || 'rectangle,#3b82f6').split(',')
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'shape',
          position,
          data: { shape: shape as 'rectangle' | 'circle' | 'triangle', backgroundColor: shapeColor, width: 100, height: 100 },
          style: { width: 100, height: 100 }
        }
        break
      case 'board':
        const boardId = `board-${nodeIdCounter.current++}`
        const newBoard: Board = {
          id: boardId,
          name: '',
          parentId: workspaceData.currentBoardId,
          nodes: [],
          edges: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        newNode = {
          id: `node-${boardId}`,
          type: 'board',
          position,
          data: {
            boardId,
            name: '',
            itemCount: 0,
            onNameChange: (id: string, name: string) => {
              boardNameChangeRef.current?.(id, name)
            }
          }
        }
        // 보드 데이터 업데이트
        const updatedData = {
          ...workspaceData,
          boards: {
            ...workspaceData.boards,
            [boardId]: newBoard
          }
        }
        setWorkspaceData(updatedData)
        saveWorkspaceData(updatedData)
        break
      case 'reference':
        const refType = (nodeData || 'pose') as ReferenceNodeData['referenceType']
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'reference',
          position,
          data: { referenceType: refType, strength: 0.8, selectedOptions: [] },
          style: { width: 280, height: 320 }
        }
        break
      case 'postProcess':
        const ppType = (nodeData || 'removeBackground') as PostProcessNodeData['processType']
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'postProcess',
          position,
          data: { processType: ppType, intensity: 1.0, selectedOptions: [] },
          style: { width: 260, height: 200 }
        }
        break
      default:
        return
    }

    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }, [reactFlowInstance, workspaceData, setNodes])

  // 보드 이름 변경
  const handleBoardNameChange = useCallback((boardId: string, newName: string) => {
    // 보드 데이터 업데이트
    const board = workspaceData.boards[boardId]
    if (!board) return

    const updatedBoards = {
      ...workspaceData.boards,
      [boardId]: { ...board, name: newName, updatedAt: Date.now() }
    }

    // 현재 보드의 노드에서도 이름 업데이트
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'board' && node.data.boardId === boardId) {
          return { ...node, data: { ...node.data, name: newName } }
        }
        return node
      })
    )

    const updatedData = { ...workspaceData, boards: updatedBoards }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)
  }, [workspaceData, setNodes])

  // ref에 콜백 연결
  useEffect(() => {
    boardNameChangeRef.current = handleBoardNameChange
  }, [handleBoardNameChange])


  // 트레이에 아이템 추가
  const addToTray = useCallback((type: TrayItem['type'], data: TrayItem['data']) => {
    const newItem: TrayItem = {
      id: `tray-${nodeIdCounter.current++}`,
      type,
      data,
      createdAt: Date.now()
    }
    const updatedData = {
      ...workspaceData,
      tray: [...workspaceData.tray, newItem]
    }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)
  }, [workspaceData])

  // 트레이에서 아이템 제거
  const removeFromTray = useCallback((itemId: string) => {
    const updatedData = {
      ...workspaceData,
      tray: workspaceData.tray.filter(item => item.id !== itemId)
    }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)
  }, [workspaceData])

  // 트레이 아이템을 캔버스에 배치
  const placeFromTray = useCallback((item: TrayItem, position: { x: number, y: number }) => {
    const newNode: Node = {
      id: String(nodeIdCounter.current++),
      type: item.type,
      position,
      data: item.data
    }

    // 보드 타입인 경우 추가 처리
    if (item.type === 'board' && (item.data as BoardNodeData).boardId) {
      const boardData = item.data as BoardNodeData
      newNode.data = {
        ...boardData,
        onNameChange: (id: string, name: string) => {
          boardNameChangeRef.current?.(id, name)
        }
      }
    }

    setNodes((nds) => [...nds, newNode])
    removeFromTray(item.id)
  }, [setNodes, removeFromTray])

  // 클립보드 붙여넣기 핸들러
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
              const imageUrl = ev.target?.result as string
              addToTray('image', {
                imageUrl,
                label: '클립보드 이미지',
                width: 300,
                height: 300
              } as ImageNodeData)
            }
            reader.readAsDataURL(file)
          }
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addToTray])

  // 선택된 노드 삭제
  const deleteSelected = () => {
    // 보드 노드 삭제 시 해당 보드도 삭제
    const selectedBoardNodes = nodes.filter(n => n.selected && n.type === 'board')
    if (selectedBoardNodes.length > 0) {
      const boardIdsToDelete = selectedBoardNodes.map(n => (n.data as BoardNodeData).boardId)
      const updatedBoards = { ...workspaceData.boards }
      boardIdsToDelete.forEach(id => {
        delete updatedBoards[id]
      })
      const updatedData = { ...workspaceData, boards: updatedBoards }
      setWorkspaceData(updatedData)
      saveWorkspaceData(updatedData)
    }

    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }

  // 전체 선택
  const selectAll = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
  }

  // 전체 선택 해제
  const deselectAll = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
  }

  // 상위 보드로 이동
  const goToParentBoard = () => {
    if (currentBoard?.parentId) {
      navigateToBoard(currentBoard.parentId)
    }
  }

  // 키보드 단축키 핸들러 (Delete/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 무시
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nodes, edges, workspaceData])

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="workspace-container">
      {/* 상단 브레드크럼 네비게이션 */}
      <div className="workspace-header">
        <div className="breadcrumb">
          {breadcrumbs.map((board, index) => (
            <span key={board.id} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              <button
                className={`breadcrumb-link ${board.id === workspaceData.currentBoardId ? 'active' : ''}`}
                onClick={() => navigateToBoard(board.id)}
              >
                {board.id === 'home' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ) : null}
                <span>{board.name}</span>
              </button>
            </span>
          ))}
        </div>
        <div className="workspace-header-actions">
          {currentBoard?.parentId && (
            <button className="header-btn" onClick={goToParentBoard} title="상위 보드로">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              뒤로
            </button>
          )}
        </div>
      </div>

      {/* 왼쪽 툴바 */}
      <div className="toolbar">
        {/* 나가기 버튼 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button exit-button"
            data-tooltip="홈으로 나가기"
            onClick={() => navigate('/')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 선택 도구 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${activeTool === 'select' ? 'active' : ''}`}
            data-tooltip="선택 도구"
            onClick={() => { setActiveTool('select'); deselectAll() }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </button>
        </div>

        {/* 손바닥 도구 (패닝) */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${activeTool === 'pan' ? 'active' : ''}`}
            data-tooltip="이동 도구"
            onClick={() => setActiveTool('pan')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 추가 도구 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${showAddPanel ? 'active' : ''}`}
            data-tooltip="요소 추가"
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </button>
        </div>

        {/* 이미지 업로드 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button"
            data-tooltip="이미지 업로드"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    addImageToCanvas(ev.target?.result as string, file.name)
                  }
                  reader.readAsDataURL(file)
                }
              }
              input.click()
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 전체 선택 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button"
            data-tooltip="전체 선택"
            onClick={selectAll}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </button>
        </div>

        {/* 삭제 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button delete-button"
            data-tooltip="선택 삭제"
            onClick={deleteSelected}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 추가 패널 (드래그 앤 드롭) */}
      {showAddPanel && (
        <div className="add-panel">
          <div className="add-panel-header">
            <h3>도구 (드래그하여 배치)</h3>
            <button className="add-panel-close" onClick={() => setShowAddPanel(false)}>×</button>
          </div>
          <div className="add-panel-content">
            {/* AI 도구 */}
            <div className="add-section">
              <h4>AI 도구</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item ai-generator-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'aiGenerator')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🤖</span>
                  <span>AI 생성기</span>
                </div>
                <div
                  className="draggable-item prompt-builder-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'promptBuilder')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎨</span>
                  <span>프롬프트 빌더</span>
                </div>
              </div>
            </div>

            {/* 참조 노드 */}
            <div className="add-section">
              <h4>참조 노드</h4>
              <div className="draggable-items reference-items">
                <div
                  className="draggable-item ref-pose-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'pose')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🏃</span>
                  <span>포즈</span>
                </div>
                <div
                  className="draggable-item ref-char-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'character')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">👤</span>
                  <span>캐릭터</span>
                </div>
                <div
                  className="draggable-item ref-style-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'style')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎨</span>
                  <span>스타일</span>
                </div>
                <div
                  className="draggable-item ref-comp-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'composition')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">📐</span>
                  <span>구도</span>
                </div>
                <div
                  className="draggable-item ref-bg-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'background')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🏞️</span>
                  <span>배경</span>
                </div>
                <div
                  className="draggable-item ref-obj-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.setData('application/reactflow-data', 'object')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">📦</span>
                  <span>오브젝트</span>
                </div>
              </div>
            </div>

            {/* 후처리 노드 */}
            <div className="add-section">
              <h4>후처리 노드</h4>
              <div className="draggable-items postprocess-items">
                <div
                  className="draggable-item pp-remove-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.setData('application/reactflow-data', 'removeBackground')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🔲</span>
                  <span>배경 제거</span>
                </div>
                <div
                  className="draggable-item pp-line-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.setData('application/reactflow-data', 'extractLine')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">✏️</span>
                  <span>라인 추출</span>
                </div>
                <div
                  className="draggable-item pp-mat-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.setData('application/reactflow-data', 'materialID')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🏷️</span>
                  <span>재질맵</span>
                </div>
                <div
                  className="draggable-item pp-up-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.setData('application/reactflow-data', 'upscale')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🔍</span>
                  <span>업스케일</span>
                </div>
                <div
                  className="draggable-item pp-sty-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.setData('application/reactflow-data', 'stylize')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">✨</span>
                  <span>스타일 변환</span>
                </div>
              </div>
            </div>

            {/* 보드 (폴더) */}
            <div className="add-section">
              <h4>보드</h4>
              <div
                className="draggable-item board-drag"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow-type', 'board')
                  e.dataTransfer.effectAllowed = 'move'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>새 보드</span>
              </div>
            </div>

            {/* 노트 */}
            <div className="add-section">
              <h4>노트</h4>
              <div className="add-color-grid">
                {noteColors.map((nc) => (
                  <div
                    key={nc.color}
                    className="draggable-color-btn"
                    style={{ backgroundColor: nc.color }}
                    title={nc.name}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow-type', 'note')
                      e.dataTransfer.setData('application/reactflow-data', nc.color)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 텍스트 */}
            <div className="add-section">
              <h4>텍스트</h4>
              <div
                className="draggable-item text-drag"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow-type', 'text')
                  e.dataTransfer.effectAllowed = 'move'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
                <span>텍스트</span>
              </div>
            </div>

            {/* 도형 */}
            <div className="add-section">
              <h4>도형</h4>
              <div className="add-shape-grid">
                <div
                  className="draggable-shape-btn"
                  title="사각형"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'shape')
                    e.dataTransfer.setData('application/reactflow-data', 'rectangle,#3b82f6')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <div className="shape-preview shape-rect" />
                </div>
                <div
                  className="draggable-shape-btn"
                  title="원"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'shape')
                    e.dataTransfer.setData('application/reactflow-data', 'circle,#3b82f6')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <div className="shape-preview shape-circle" />
                </div>
                <div
                  className="draggable-shape-btn"
                  title="삼각형"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'shape')
                    e.dataTransfer.setData('application/reactflow-data', 'triangle,#3b82f6')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <div className="shape-preview shape-triangle" />
                </div>
              </div>
              <div className="add-color-grid">
                {shapeColors.map((sc) => (
                  <div
                    key={sc.color}
                    className="draggable-color-btn"
                    style={{ backgroundColor: sc.color }}
                    title={sc.name}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow-type', 'shape')
                      e.dataTransfer.setData('application/reactflow-data', `rectangle,${sc.color}`)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div className="react-flow-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          selectionOnDrag
          panOnScroll={activeTool === 'pan'}
          panOnDrag={activeTool === 'pan'}
          selectNodesOnDrag={activeTool === 'select'}
          onDrop={(e) => {
            e.preventDefault()
            // 트레이 아이템 드롭 처리
            const trayItemId = e.dataTransfer.getData('tray-item-id')
            if (trayItemId) {
              const item = trayItems.find(i => i.id === trayItemId)
              if (item) {
                const reactFlowBounds = e.currentTarget.getBoundingClientRect()
                const position = {
                  x: e.clientX - reactFlowBounds.left - 60,
                  y: e.clientY - reactFlowBounds.top - 48
                }
                placeFromTray(item, position)
              }
              return
            }
            // 추가 패널에서 드래그한 노드 드롭 처리
            onDrop(e)
          }}
          onDragOver={onDragOver}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'image') return '#3b82f6'
              if (node.type === 'note') return '#fbbf24'
              if (node.type === 'text') return '#6b7280'
              if (node.type === 'shape') return '#a855f7'
              if (node.type === 'board') return '#22c55e'
              return '#6b7280'
            }}
          />
        </ReactFlow>
      </div>

      {/* 하단 트레이 */}
      {showTray && (
        <div className="bottom-tray">
          <div className="tray-header">
            <span className="tray-title">트레이</span>
            <span className="tray-count">{trayItems.length}개</span>
            <button className="tray-toggle" onClick={() => setShowTray(false)} title="트레이 닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="tray-items">
            {trayItems.length === 0 ? (
              <div className="tray-empty">
                Ctrl+V로 이미지 붙여넣기 또는<br />AI 생성 이미지가 여기에 저장됩니다
              </div>
            ) : (
              trayItems.map((item) => (
                <div
                  key={item.id}
                  className="tray-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('tray-item-id', item.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  {item.type === 'image' && (item.data as ImageNodeData).imageUrl && (
                    <img
                      src={(item.data as ImageNodeData).imageUrl}
                      alt={(item.data as ImageNodeData).label}
                      className="tray-item-image"
                      draggable={false}
                    />
                  )}
                  {item.type === 'note' && (
                    <div
                      className="tray-item-note"
                      style={{ backgroundColor: (item.data as NoteNodeData).backgroundColor }}
                    />
                  )}
                  {item.type === 'board' && (
                    <div className="tray-item-board">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  )}
                  <button
                    className="tray-item-remove"
                    onClick={() => removeFromTray(item.id)}
                    title="트레이에서 제거"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 트레이 열기 버튼 (트레이가 닫혀있을 때) */}
      {!showTray && (
        <button className="tray-open-btn" onClick={() => setShowTray(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l7-7 7 7" />
          </svg>
          트레이 {trayItems.length > 0 ? `(${trayItems.length})` : ''}
        </button>
      )}

    </div>
  )
}

export default function Workspace() {
  return (
    <ReactFlowProvider>
      <WorkspaceCanvas />
    </ReactFlowProvider>
  )
}
