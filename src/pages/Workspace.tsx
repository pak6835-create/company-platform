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

// 보드 노드 (폴더 아이콘) - 더블클릭으로 진입
function BoardNode({ data, selected }: NodeProps<BoardNodeData>) {
  return (
    <div className={`board-node ${selected ? 'selected' : ''}`} style={{ borderColor: data.color || '#3b82f6' }}>
      <div className="board-node-icon" style={{ backgroundColor: data.color || '#3b82f6' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <div className="board-node-name">{data.name}</div>
      {data.itemCount !== undefined && data.itemCount > 0 && (
        <div className="board-node-count">{data.itemCount}개 항목</div>
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

// 보드 색상 옵션
const boardColors = [
  { name: '파랑', color: '#3b82f6' },
  { name: '초록', color: '#22c55e' },
  { name: '보라', color: '#a855f7' },
  { name: '주황', color: '#f97316' },
  { name: '분홍', color: '#ec4899' },
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
  currentBoardId: 'home'
})

// 데이터 로드
const loadWorkspaceData = (): WorkspaceData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
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

  // 현재 보드 가져오기
  const currentBoard = workspaceData.boards[workspaceData.currentBoardId]

  // 브레드크럼 경로 생성
  const getBreadcrumbs = useCallback(() => {
    const path: Board[] = []
    let boardId: string | null = workspaceData.currentBoardId

    while (boardId) {
      const board = workspaceData.boards[boardId]
      if (board) {
        path.unshift(board)
        boardId = board.parentId
      } else {
        break
      }
    }
    return path
  }, [workspaceData])

  // 보드 로드
  useEffect(() => {
    if (currentBoard) {
      setNodes(currentBoard.nodes)
      setEdges(currentBoard.edges)
    }
  }, [workspaceData.currentBoardId, currentBoard, setNodes, setEdges])

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
  const addBoard = (color: string = '#3b82f6') => {
    const boardId = `board-${nodeIdCounter.current++}`
    const boardName = `보드 ${Object.keys(workspaceData.boards).length}`

    // 새 보드 데이터 생성
    const newBoard: Board = {
      id: boardId,
      name: boardName,
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
      data: { boardId, name: boardName, color, itemCount: 0 }
    }

    // 워크스페이스 데이터 업데이트
    const updatedData = {
      ...workspaceData,
      boards: {
        ...workspaceData.boards,
        [boardId]: newBoard
      }
    }
    setWorkspaceData(updatedData)
    saveWorkspaceData(updatedData)

    setNodes((nds) => [...nds, newNode])
    setShowAddPanel(false)
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

      {/* 추가 패널 */}
      {showAddPanel && (
        <div className="add-panel">
          <div className="add-panel-header">
            <h3>요소 추가</h3>
            <button className="add-panel-close" onClick={() => setShowAddPanel(false)}>×</button>
          </div>
          <div className="add-panel-content">
            {/* 보드 (폴더) */}
            <div className="add-section">
              <h4>보드 (폴더)</h4>
              <div className="add-color-grid">
                {boardColors.map((bc) => (
                  <button
                    key={bc.color}
                    className="add-color-btn add-board-btn"
                    style={{ backgroundColor: bc.color }}
                    onClick={() => addBoard(bc.color)}
                    title={bc.name + ' 보드'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* 노트 */}
            <div className="add-section">
              <h4>노트</h4>
              <div className="add-color-grid">
                {noteColors.map((nc) => (
                  <button
                    key={nc.color}
                    className="add-color-btn"
                    style={{ backgroundColor: nc.color }}
                    onClick={() => addNote(nc.color)}
                    title={nc.name}
                  />
                ))}
              </div>
            </div>

            {/* 텍스트 */}
            <div className="add-section">
              <h4>텍스트</h4>
              <button className="add-item-btn" onClick={addText}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
                <span>텍스트 추가</span>
              </button>
            </div>

            {/* 도형 */}
            <div className="add-section">
              <h4>도형</h4>
              <div className="add-shape-grid">
                <button className="add-shape-btn" onClick={() => addShape('rectangle')} title="사각형">
                  <div className="shape-preview shape-rect" />
                </button>
                <button className="add-shape-btn" onClick={() => addShape('circle')} title="원">
                  <div className="shape-preview shape-circle" />
                </button>
                <button className="add-shape-btn" onClick={() => addShape('triangle')} title="삼각형">
                  <div className="shape-preview shape-triangle" />
                </button>
              </div>
              <div className="add-color-grid">
                {shapeColors.map((sc) => (
                  <button
                    key={sc.color}
                    className="add-color-btn"
                    style={{ backgroundColor: sc.color }}
                    onClick={() => addShape('rectangle', sc.color)}
                    title={sc.name}
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
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          selectionOnDrag
          panOnScroll={activeTool === 'pan'}
          panOnDrag={activeTool === 'pan'}
          selectNodesOnDrag={activeTool === 'select'}
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
