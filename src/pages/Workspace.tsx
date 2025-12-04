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
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Workspace.css'
import PromptNodePanel from '../components/nodes/PromptNodePanel'

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
}

// 프롬프트 노드 데이터
interface PromptBuilderNodeData {
  combinedPrompt?: string
  onPromptChange?: (prompt: string) => void
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

// 텍스트 노드
function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  return (
    <div className={`text-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={30} />
      <div
        className="text-content"
        style={{ fontSize: data.fontSize || 16, color: data.color || '#374151' }}
      >
        {data.text}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 도형 노드
function ShapeNode({ data, selected }: NodeProps<ShapeNodeData>) {
  const shapeClass = `shape-node shape-${data.shape}`
  return (
    <div
      className={`${shapeClass} ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.backgroundColor || '#3b82f6',
        width: data.width || 100,
        height: data.height || 100
      }}
    >
      <Handle type="target" position={Position.Top} />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={50} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// AI 생성기 노드 (캔버스에 배치되는 카드형)
function AIGeneratorNode({ data, selected }: NodeProps<AIGeneratorNodeData>) {
  const [localApiKey, setLocalApiKey] = useState(data.apiKey || '')
  const [localModel, setLocalModel] = useState(data.model || 'gemini-2.0-flash-exp')
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!localApiKey || !localPrompt) {
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
        ? JSON.stringify({ prompt: localPrompt, apiKey: localApiKey, model: localModel })
        : JSON.stringify({
            contents: [{ parts: [{ text: localPrompt }] }],
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
        data.onGenerate(imageUrl, localPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`ai-generator-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="prompt-in" />
      <NodeResizer isVisible={selected} minWidth={280} minHeight={200} />

      <div className="ai-node-header">
        <span>🤖 AI 이미지 생성기</span>
      </div>

      <div className="ai-node-content">
        <div className="ai-node-field">
          <label>API 키</label>
          <div className="ai-node-input-row">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="AIza..."
            />
            <button onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? '숨김' : '보기'}
            </button>
          </div>
        </div>

        <div className="ai-node-field">
          <label>모델</label>
          <select value={localModel} onChange={(e) => setLocalModel(e.target.value)}>
            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
            <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro</option>
          </select>
        </div>

        <div className="ai-node-field">
          <label>프롬프트</label>
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            placeholder="생성할 이미지 설명..."
            rows={3}
          />
        </div>

        {error && <div className="ai-node-error">{error}</div>}

        <button
          className="ai-node-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ 생성 중...' : '✨ 이미지 생성'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}

// 프롬프트 빌더 노드 (캔버스에 배치되는 카드형)
function PromptBuilderNode({ data, selected }: NodeProps<PromptBuilderNodeData>) {
  const [activeTab, setActiveTab] = useState<'scene' | 'character' | 'props'>('scene')
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({})
  const [userPrompt, setUserPrompt] = useState('')

  // 간소화된 노드 데이터
  const MINI_NODE_DATA = {
    scene: {
      style: { title: '🎨 스타일', options: [
        { id: 'webtoon', label: '웹툰', prompt: 'webtoon style' },
        { id: 'anime', label: '애니', prompt: 'anime style' },
        { id: 'realistic', label: '사실적', prompt: 'realistic' },
      ]},
      background: { title: '🏠 배경', options: [
        { id: 'indoor', label: '실내', prompt: 'indoor scene' },
        { id: 'outdoor', label: '실외', prompt: 'outdoor scene' },
        { id: 'city', label: '도시', prompt: 'urban cityscape' },
      ]},
      time: { title: '🌅 시간대', options: [
        { id: 'day', label: '낮', prompt: 'daytime' },
        { id: 'night', label: '밤', prompt: 'nighttime' },
        { id: 'sunset', label: '황혼', prompt: 'sunset' },
      ]},
    },
    character: {
      gender: { title: '👤 성별', options: [
        { id: 'male', label: '남성', prompt: 'male character' },
        { id: 'female', label: '여성', prompt: 'female character' },
      ]},
      age: { title: '🎂 나이', options: [
        { id: 'teen', label: '10대', prompt: 'teenager' },
        { id: '20s', label: '20대', prompt: '20s' },
        { id: '30s', label: '30대', prompt: '30s' },
      ]},
      expression: { title: '😄 표정', options: [
        { id: 'smile', label: '미소', prompt: 'smiling' },
        { id: 'serious', label: '진지', prompt: 'serious' },
        { id: 'angry', label: '화남', prompt: 'angry' },
      ]},
    },
    props: {
      weapon: { title: '⚔️ 무기', options: [
        { id: 'sword', label: '검', prompt: 'sword' },
        { id: 'bow', label: '활', prompt: 'bow' },
        { id: 'staff', label: '지팡이', prompt: 'magic staff' },
      ]},
      item: { title: '📱 아이템', options: [
        { id: 'phone', label: '폰', prompt: 'smartphone' },
        { id: 'book', label: '책', prompt: 'book' },
        { id: 'coffee', label: '커피', prompt: 'coffee cup' },
      ]},
    }
  }

  const currentData = MINI_NODE_DATA[activeTab]

  const toggleOption = (catKey: string, optId: string) => {
    setSelectedOptions(prev => {
      const curr = prev[catKey] || []
      return {
        ...prev,
        [catKey]: curr.includes(optId) ? curr.filter(id => id !== optId) : [...curr, optId]
      }
    })
  }

  const getCombinedPrompt = () => {
    const parts: string[] = []
    if (userPrompt.trim()) parts.push(userPrompt.trim())

    Object.entries(selectedOptions).forEach(([catKey, optIds]) => {
      const cat = currentData[catKey as keyof typeof currentData]
      if (cat) {
        optIds.forEach(optId => {
          const opt = cat.options.find(o => o.id === optId)
          if (opt) parts.push(opt.prompt)
        })
      }
    })

    return parts.join(', ')
  }

  useEffect(() => {
    if (data.onPromptChange) {
      data.onPromptChange(getCombinedPrompt())
    }
  }, [selectedOptions, userPrompt, activeTab])

  return (
    <div className={`prompt-builder-node ${selected ? 'selected' : ''}`}>
      <NodeResizer isVisible={selected} minWidth={320} minHeight={280} />

      <div className="prompt-node-header">
        <span>🎨 프롬프트 빌더</span>
      </div>

      <div className="prompt-node-tabs">
        <button className={activeTab === 'scene' ? 'active' : ''} onClick={() => setActiveTab('scene')}>장면</button>
        <button className={activeTab === 'character' ? 'active' : ''} onClick={() => setActiveTab('character')}>캐릭터</button>
        <button className={activeTab === 'props' ? 'active' : ''} onClick={() => setActiveTab('props')}>소품</button>
      </div>

      <div className="prompt-node-body">
        <input
          type="text"
          className="prompt-node-input"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="기본 프롬프트..."
        />

        <div className="prompt-node-categories">
          {Object.entries(currentData).map(([catKey, cat]) => (
            <div key={catKey} className="prompt-mini-category">
              <span className="prompt-cat-title">{cat.title}</span>
              <div className="prompt-cat-options">
                {cat.options.map(opt => (
                  <button
                    key={opt.id}
                    className={`prompt-opt-btn ${(selectedOptions[catKey] || []).includes(opt.id) ? 'active' : ''}`}
                    onClick={() => toggleOption(catKey, opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {getCombinedPrompt() && (
          <div className="prompt-node-preview">
            <span>📝 {getCombinedPrompt()}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="prompt-out" />
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
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')

  // AI Tool states
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState('gemini-2.0-flash-exp')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ text: '', percent: 0 })
  const [error, setError] = useState('')

  const nodeIdCounter = useRef(Date.now())
  const [showTray, setShowTray] = useState(true)
  const [showNodePanel, setShowNodePanel] = useState(false)
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

  // 캔버스에 노드 추가 함수들
  const addImageToCanvas = (imageUrl: string, label: string) => {
    const newNode: Node<ImageNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'image',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { imageUrl, label, width: 300, height: 300 }
    }
    setNodes((nds) => [...nds, newNode])
  }

  const addNote = (color: string = '#fef3c7') => {
    const newNode: Node<NoteNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'note',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: color }
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }

  const addText = () => {
    const newNode: Node<TextNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'text',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { text: '텍스트를 입력하세요', fontSize: 16, color: '#374151' }
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
  }

  const addShape = (shape: 'rectangle' | 'circle' | 'triangle', color: string = '#3b82f6') => {
    const newNode: Node<ShapeNodeData> = {
      id: String(nodeIdCounter.current++),
      type: 'shape',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { shape, backgroundColor: color, width: 100, height: 100 }
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
          }
        }
        break
      case 'promptBuilder':
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'promptBuilder',
          position,
          data: {}
        }
        break
      case 'note':
        const color = nodeData || '#fef3c7'
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'note',
          position,
          data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: color }
        }
        break
      case 'text':
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'text',
          position,
          data: { text: '텍스트를 입력하세요', fontSize: 16, color: '#374151' }
        }
        break
      case 'shape':
        const [shape, shapeColor] = (nodeData || 'rectangle,#3b82f6').split(',')
        newNode = {
          id: String(nodeIdCounter.current++),
          type: 'shape',
          position,
          data: { shape: shape as 'rectangle' | 'circle' | 'triangle', backgroundColor: shapeColor, width: 100, height: 100 }
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
      // 트레이에 추가
      addToTray('image', {
        imageUrl,
        label: prompt.slice(0, 30) + '...',
        width: 300,
        height: 300
      } as ImageNodeData)
      setProgress({ text: '완료! 트레이에 추가됨', percent: 100 })
      setPrompt('')
      setShowAIPanel(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

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

        {/* AI 도구 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${showAIPanel ? 'active' : ''}`}
            data-tooltip="AI 이미지 생성"
            onClick={() => { setShowAIPanel(!showAIPanel); setShowAddPanel(false) }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 추가 도구 */}
        <div className="toolbar-group">
          <button
            className={`toolbar-group-button ${showAddPanel ? 'active' : ''}`}
            data-tooltip="요소 추가"
            onClick={() => { setShowAddPanel(!showAddPanel); setShowAIPanel(false) }}
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
              <button
                className="ai-node-helper-btn"
                onClick={() => { setShowNodePanel(true); setShowAIPanel(false) }}
              >
                🎨 프롬프트 노드로 생성
              </button>
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

      {/* 프롬프트 노드 패널 */}
      {showNodePanel && (
        <>
          <div className="node-panel-overlay" onClick={() => setShowNodePanel(false)} />
          <PromptNodePanel
            onPromptGenerated={(generatedPrompt) => {
              setPrompt(generatedPrompt)
              setShowNodePanel(false)
              setShowAIPanel(true)
            }}
            onClose={() => setShowNodePanel(false)}
          />
        </>
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
