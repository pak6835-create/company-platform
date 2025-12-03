import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  NodeResizer,
  Handle,
  Position,
  NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Workspace.css'

// 이미지 노드 데이터 타입
interface ImageNodeData {
  imageUrl: string
  label: string
  width?: number
  height?: number
}

// 노트 노드 데이터 타입
interface NoteNodeData {
  content: string
  backgroundColor?: string
}

// 커스텀 이미지 노드
function ImageNode({ data, selected }: NodeProps<ImageNodeData>) {
  return (
    <div className={`image-node ${selected ? 'selected' : ''}`} style={{ width: data.width || 300, height: data.height || 200 }}>
      <Handle type="target" position={Position.Top} />
      <NodeResizer isVisible={selected} minWidth={100} minHeight={100} keepAspectRatio />
      <div className="image-content">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.label} className="image-thumbnail" draggable={false} />
        ) : (
          <div className="image-loading">Loading...</div>
        )}
      </div>
      <div className="image-label">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 커스텀 노트 노드
function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  return (
    <div className={`note-node ${selected ? 'selected' : ''}`} style={{ backgroundColor: data.backgroundColor || '#fef3c7' }}>
      <Handle type="target" position={Position.Top} />
      <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
      <div className="note-content">{data.content}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = {
  image: ImageNode,
  note: NoteNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'note',
    position: { x: 250, y: 100 },
    data: {
      content: 'Workspace에 오신 것을 환영합니다!\n\n왼쪽 AI 도구로 이미지를 생성하면\n여기에 자동으로 배치됩니다.',
      backgroundColor: '#fef3c7',
    },
  },
]

const initialEdges: Edge[] = []

function WorkspaceCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // AI Tool states
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState('gemini-2.0-flash-exp')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ text: '', percent: 0 })
  const [error, setError] = useState('')

  const nodeIdCounter = useRef(2)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // 이미지 생성 함수
  const generateImage = async (promptText: string): Promise<string> => {
    const isProduction = window.location.hostname !== 'localhost'
    const endpoint = isProduction
      ? '/.netlify/functions/generate'
      : `/api/gemini/v1beta/models/${model}:generateContent?key=${apiKey}`

    const parts = [{ text: promptText }]

    const body = isProduction
      ? JSON.stringify({ prompt: promptText, apiKey, model })
      : JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message || data.error)

    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData?.data
    )
    if (!imagePart) throw new Error('이미지 생성 실패')

    return 'data:image/png;base64,' + imagePart.inlineData.data
  }

  // 캔버스에 이미지 추가
  const addImageToCanvas = (imageUrl: string, label: string) => {
    const newNode: Node<ImageNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'image',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { imageUrl, label, width: 300, height: 300 }
    }
    setNodes((nds) => [...nds, newNode])
  }

  // AI 생성 실행
  const handleGenerate = async () => {
    if (!apiKey || !prompt) {
      setError('API 키와 프롬프트를 입력해주세요')
      return
    }

    setIsGenerating(true)
    setError('')
    setProgress({ text: '이미지 생성 중...', percent: 50 })

    try {
      const imageUrl = await generateImage(prompt)
      addImageToCanvas(imageUrl, prompt.slice(0, 30) + '...')
      setProgress({ text: '완료!', percent: 100 })
      setPrompt('')
      setShowAIPanel(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

  // 노트 추가
  const addNote = () => {
    const newNode: Node<NoteNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'note',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: '#fef3c7' }
    }
    setNodes((nds) => [...nds, newNode])
    setOpenDropdown(null)
  }

  return (
    <div className="workspace-container">
      {/* 왼쪽 툴바 */}
      <div className="toolbar">
        {/* AI 도구 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${showAIPanel ? 'active' : ''}`}
            data-tooltip="AI 이미지 생성"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 노드 추가 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button"
            data-tooltip="노트 추가"
            onClick={addNote}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </button>
        </div>

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

        {/* 삭제 */}
        <div className="toolbar-group">
          <button
            className="toolbar-group-button delete-button"
            data-tooltip="선택 삭제"
            onClick={() => {
              setNodes((nds) => nds.filter((n) => !n.selected))
              setEdges((eds) => eds.filter((e) => !e.selected))
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* AI 패널 */}
      {showAIPanel && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>AI 이미지 생성</h3>
            <button className="ai-panel-close" onClick={() => setShowAIPanel(false)}>×</button>
          </div>

          <div className="ai-panel-content">
            <div className="ai-input-group">
              <label>API 키</label>
              <div className="ai-input-row">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                />
                <button onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? '숨김' : '보기'}
                </button>
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="ai-link">
                API 키 발급받기 →
              </a>
            </div>

            <div className="ai-input-group">
              <label>모델</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gemini-2.0-flash-exp">Nano Banana (무료)</option>
                <option value="gemini-3-pro-image-preview">Nano Banana Pro 3.0 (유료)</option>
              </select>
            </div>

            <div className="ai-input-group">
              <label>프롬프트</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 이미지 설명..."
                rows={4}
              />
            </div>

            {error && <div className="ai-error">{error}</div>}

            {isGenerating && (
              <div className="ai-progress">
                <span>{progress.text}</span>
                <div className="ai-progress-bar">
                  <div className="ai-progress-fill" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}

            <button
              className="ai-generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !apiKey || !prompt}
            >
              {isGenerating ? '생성 중...' : '캔버스에 생성'}
            </button>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div className="react-flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          selectionOnDrag
          panOnScroll
          selectNodesOnDrag={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'image') return '#3b82f6'
              if (node.type === 'note') return '#fbbf24'
              return '#6b7280'
            }}
          />
        </ReactFlow>
      </div>
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
