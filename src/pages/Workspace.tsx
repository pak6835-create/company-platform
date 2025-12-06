import { useState, useCallback, useRef, useEffect, Component, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  Connection,
  SelectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Workspace.css'

// 에러 바운더리 컴포넌트
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class WorkspaceErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    // localStorage 초기화
    localStorage.removeItem('workspace_data')
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="workspace-error">
          <h2>워크스페이스 로드 오류</h2>
          <p>저장된 데이터에 문제가 있습니다.</p>
          <p className="error-detail">{this.state.error?.message}</p>
          <button onClick={this.handleReset}>
            데이터 초기화 후 새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// 워크스페이스 모듈 import
import { nodeTypes } from '../workspace/components'
import { useWorkspace } from '../workspace/hooks'
import { NOTE_COLORS, SHAPE_COLORS } from '../workspace/config'
import { Board, WorkspaceData } from '../workspace/types'
import { saveWorkspaceData } from '../workspace/utils'

// 히스토리 타입
interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

// 어셋 라이브러리 타입
interface Asset {
  id: string
  url: string
  prompt: string
  timestamp: number
  category: string // 어셋 카테고리
}

// 어셋 카테고리 타입
interface AssetCategory {
  id: string
  name: string
  color: string
}

function WorkspaceCanvas() {
  const navigate = useNavigate()
  const {
    workspaceData,
    setWorkspaceData,
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    currentBoard,
    getBreadcrumbs,
    navigateToBoard,
    boardNameChangeRef,
    getNewNodeId,
  } = useWorkspace()

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [showAssetLibrary, setShowAssetLibrary] = useState(true)
  const [libraryWidth, setLibraryWidth] = useState(240) // 라이브러리 가로폭
  // 어셋은 메모리에만 저장 (base64 이미지가 너무 커서 localStorage 용량 초과)
  const [assets, setAssets] = useState<Asset[]>([])
  // 어셋 카테고리 목록
  const [categories, setCategories] = useState<AssetCategory[]>([
    { id: 'default', name: '전체', color: '#3b82f6' },
    { id: 'character', name: '캐릭터', color: '#8b5cf6' },
    { id: 'background', name: '배경', color: '#10b981' },
    { id: 'prop', name: '소품', color: '#f59e0b' },
  ])
  const [selectedCategory, setSelectedCategory] = useState('default')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  // 어셋 추가 이벤트 리스너
  useEffect(() => {
    const handleAssetAdd = (e: Event) => {
      const { url, prompt, timestamp, category } = (e as CustomEvent).detail
      setAssets(prev => [
        { id: `asset-${timestamp}`, url, prompt, timestamp, category: category || 'default' },
        ...prev
      ].slice(0, 50)) // 최대 50개로 제한
    }
    window.addEventListener('asset-add', handleAssetAdd)
    return () => window.removeEventListener('asset-add', handleAssetAdd)
  }, [])

  // 실행취소/다시실행 히스토리
  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const isUndoRedo = useRef(false)

  // 클립보드
  const [clipboard, setClipboard] = useState<Node[]>([])

  // 히스토리에 현재 상태 저장
  const saveToHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false
      return
    }
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    }
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current = [...newHistory, newState].slice(-50)
    historyIndexRef.current = Math.min(historyIndexRef.current + 1, 49)
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  // 실행취소
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoRedo.current = true
      historyIndexRef.current -= 1
      const prevState = historyRef.current[historyIndexRef.current]
      if (prevState) {
        setNodes(prevState.nodes)
        setEdges(prevState.edges)
      }
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
  }, [setNodes, setEdges])

  // 다시실행
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedo.current = true
      historyIndexRef.current += 1
      const nextState = historyRef.current[historyIndexRef.current]
      if (nextState) {
        setNodes(nextState.nodes)
        setEdges(nextState.edges)
      }
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }, [setNodes, setEdges])

  // 복사
  const copySelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(selectedNodes)))
    }
  }, [nodes])

  // 붙여넣기
  const pasteNodes = useCallback(() => {
    if (clipboard.length === 0) return
    const newNodes = clipboard.map((node) => ({
      ...node,
      id: getNewNodeId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: true,
    }))
    setNodes((nds) => {
      const updated = [
        ...nds.map((n) => ({ ...n, selected: false })),
        ...newNodes,
      ]
      return updated
    })
  }, [clipboard, getNewNodeId, setNodes])

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Ctrl+Z: 실행취소
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Shift+Z 또는 Ctrl+Y: 다시실행
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        redo()
      }
      // Ctrl+C: 복사
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelectedNodes()
      }
      // Ctrl+V: 붙여넣기
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteNodes()
      }
      // Ctrl+A: 전체 선택
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
      }
      // Delete 또는 Backspace: 선택된 노드 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id)
        if (selectedNodeIds.length > 0) {
          setNodes((nds) => nds.filter((n) => !n.selected))
          setEdges((eds) => eds.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)))
        }
      }
      // Escape: 선택 해제
      if (e.key === 'Escape') {
        e.preventDefault()
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
        setShowAddPanel(false)
      }
      // L: 라이브러리 토글
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowAssetLibrary((prev) => !prev)
      }
      // N: 노드 추가 패널 토글
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowAddPanel((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copySelectedNodes, pasteNodes, setNodes, setEdges, nodes])

  // 노드/엣지 변경 시 히스토리 저장 (debounce)
  const lastSaveRef = useRef<string>('')
  useEffect(() => {
    const timer = setTimeout(() => {
      const stateKey = JSON.stringify({ n: nodes.length, e: edges.length })
      if (stateKey !== lastSaveRef.current && (nodes.length > 0 || edges.length > 0)) {
        lastSaveRef.current = stateKey
        saveToHistory(nodes, edges)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [nodes.length, edges.length])

  // 엣지 연결
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  // 캔버스에 이미지 추가
  const addImageToCanvas = useCallback(
    (imageUrl: string, label: string) => {
      const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
      const newNode: Node = {
        id: getNewNodeId(),
        type: 'image',
        position,
        data: { imageUrl, label, width: 200, height: 200 },
        style: { width: 200, height: 200 },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes, getNewNodeId]
  )

  // 드래그 앤 드롭
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      // 로컬 파일 드롭 처리
      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            const newNode: Node = {
              id: getNewNodeId(),
              type: 'image',
              position,
              data: { imageUrl: dataUrl, label: file.name.slice(0, 20) || '업로드 이미지' },
              style: { width: 200, height: 200 },
            }
            setNodes((nds) => [...nds, newNode])
          }
          reader.readAsDataURL(file)
          return
        }
      }

      // 어셋 드래그앤드롭 처리 (application/json 또는 text/plain)
      const assetData = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain')
      if (assetData) {
        try {
          const parsed = JSON.parse(assetData)
          if (parsed.type === 'asset' && parsed.url) {
            const newNode: Node = {
              id: getNewNodeId(),
              type: 'image',
              position,
              data: { imageUrl: parsed.url, label: parsed.prompt?.slice(0, 20) || 'AI 생성', prompt: parsed.prompt },
              style: { width: 200, height: 200 },
            }
            setNodes((nds) => [...nds, newNode])
            return
          }
        } catch (e) {
          // JSON 파싱 실패시 일반 노드 드롭으로 처리
        }
      }

      const nodeType = event.dataTransfer.getData('application/reactflow-type')
      const nodeData = event.dataTransfer.getData('application/reactflow-data')

      if (!nodeType) return

      let newNode: Node

      switch (nodeType) {
        case 'aiGenerator':
          newNode = {
            id: getNewNodeId(),
            type: 'aiGenerator',
            position,
            data: {
              onGenerate: (imageUrl: string, label: string) => {
                addImageToCanvas(imageUrl, label)
              },
            },
            style: { width: 900, height: 700 },
          }
          break
        case 'note':
          const color = nodeData || '#fef3c7'
          newNode = {
            id: getNewNodeId(),
            type: 'note',
            position,
            data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: color },
            style: { width: 200, height: 150 },
          }
          break
        case 'text':
          newNode = {
            id: getNewNodeId(),
            type: 'text',
            position,
            data: { text: '텍스트를 입력하세요', fontSize: 16, color: '#374151' },
            style: { width: 150, height: 50 },
          }
          break
        case 'shape':
          const [shape, shapeColor] = (nodeData || 'rectangle,#3b82f6').split(',')
          newNode = {
            id: getNewNodeId(),
            type: 'shape',
            position,
            data: {
              shape: shape as 'rectangle' | 'circle' | 'triangle',
              backgroundColor: shapeColor,
              width: 100,
              height: 100,
            },
            style: { width: 100, height: 100 },
          }
          break
        case 'board':
          const boardId = `board-${getNewNodeId()}`
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
              },
            },
          }
          const updatedData: WorkspaceData = {
            ...workspaceData,
            boards: {
              ...workspaceData.boards,
              [boardId]: newBoard,
            },
          }
          setWorkspaceData(updatedData)
          saveWorkspaceData(updatedData)
          break
        case 'reference':
          newNode = {
            id: getNewNodeId(),
            type: 'reference',
            position,
            data: { referenceType: 'pose', strength: 0.8, selectedOptions: [] },
            style: { width: 280, height: 400 },
          }
          break
        case 'transparentBg':
          newNode = {
            id: getNewNodeId(),
            type: 'transparentBg',
            position,
            data: {},
            style: { width: 400, height: 580 },
          }
          break
        case 'poseChange':
          newNode = {
            id: getNewNodeId(),
            type: 'poseChange',
            position,
            data: {},
            style: { width: 440, height: 650 },
          }
          break
        default:
          return
      }

      setNodes((nds) => [...nds, newNode])
      setShowAddPanel(false)
    },
    [reactFlowInstance, workspaceData, setNodes, setWorkspaceData, addImageToCanvas, getNewNodeId, boardNameChangeRef]
  )

  // 보드 노드 더블클릭 핸들러
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'board' && node.data.boardId) {
        navigateToBoard(node.data.boardId)
      }
    },
    [navigateToBoard]
  )

  // 선택된 노드 삭제
  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="workspace-container">
      {/* 왼쪽 툴바 */}
      <div className="toolbar">
        <button
          className="toolbar-group-button exit-button"
          data-tooltip="나가기"
          onClick={() => navigate('/')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-group-button ${activeTool === 'select' ? 'active' : ''}`}
          data-tooltip="선택"
          onClick={() => setActiveTool('select')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </button>

        <button
          className={`toolbar-group-button ${showAddPanel ? 'active' : ''}`}
          data-tooltip="도구 추가"
          onClick={() => setShowAddPanel(!showAddPanel)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-group-button ${!canUndo ? 'disabled' : ''}`}
          data-tooltip="실행취소 (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" />
          </svg>
        </button>

        <button
          className={`toolbar-group-button ${!canRedo ? 'disabled' : ''}`}
          data-tooltip="다시실행 (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10H11a5 5 0 00-5 5v2M21 10l-5-5M21 10l-5 5" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-group-button delete-button"
          data-tooltip="삭제"
          onClick={handleDelete}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>

      {/* 상단 헤더 (브레드크럼) */}
      <div className="workspace-header">
        <nav className="breadcrumb">
          {breadcrumbs.map((board, index) => (
            <div key={board.id} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">›</span>}
              <button
                className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => navigateToBoard(board.id)}
              >
                {index === 0 && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                )}
                {board.name || '홈'}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* 추가 패널 */}
      {showAddPanel && (
        <div className="add-panel">
          <div className="add-panel-header">
            <h3>도구 (드래그하여 배치)</h3>
            <button className="add-panel-close" onClick={() => setShowAddPanel(false)}>
              ×
            </button>
          </div>
          <div className="add-panel-content add-panel-scrollable">
            {/* 캐릭터 메이커 (AI 이미지 생성 통합) */}
            <div className="add-section">
              <h4>캐릭터 메이커</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item ai-generator-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'aiGenerator')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎨</span>
                  <span>캐릭터 메이커</span>
                </div>
              </div>
            </div>

            {/* 후처리 */}
            <div className="add-section">
              <h4>도구</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item transparent-bg-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'transparentBg')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎭</span>
                  <span>투명 배경 생성기</span>
                </div>
                <div
                  className="draggable-item pose-change-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'poseChange')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🕺</span>
                  <span>포즈 변경</span>
                </div>
              </div>
            </div>

            {/* 보드 */}
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
                {NOTE_COLORS.map((nc) => (
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
                    e.dataTransfer.setData('application/reactflow-data', 'circle,#22c55e')
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
                    e.dataTransfer.setData('application/reactflow-data', 'triangle,#eab308')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <div className="shape-preview shape-triangle" />
                </div>
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
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          selectNodesOnDrag
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 오른쪽 라이브러리 사이드바 */}
      <div
        className={`asset-sidebar ${showAssetLibrary ? 'open' : ''}`}
        style={showAssetLibrary ? { width: libraryWidth } : undefined}
      >
        {/* 리사이즈 핸들 */}
        {showAssetLibrary && (
          <div
            className="library-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault()
              const startX = e.clientX
              const startWidth = libraryWidth
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const newWidth = Math.max(180, Math.min(500, startWidth - (moveEvent.clientX - startX)))
                setLibraryWidth(newWidth)
              }
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )}
        <div className="asset-sidebar-header">
          <h3>📚 라이브러리 ({assets.length})</h3>
          <button onClick={() => setShowAssetLibrary(!showAssetLibrary)}>
            {showAssetLibrary ? '→' : '←'}
          </button>
        </div>
        {showAssetLibrary && (
          <div className="asset-sidebar-content">
            {/* 카테고리 탭 */}
            <div className="library-category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`library-category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  style={{ '--cat-color': cat.color } as React.CSSProperties}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
              <button
                className="library-category-add"
                onClick={() => setShowCategoryInput(true)}
                title="새 카테고리 추가"
              >
                +
              </button>
            </div>

            {/* 새 카테고리 입력 */}
            {showCategoryInput && (
              <div className="library-category-input">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="카테고리 이름"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      const colors = ['#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
                      setCategories(prev => [...prev, {
                        id: `cat-${Date.now()}`,
                        name: newCategoryName.trim(),
                        color: colors[prev.length % colors.length]
                      }])
                      setNewCategoryName('')
                      setShowCategoryInput(false)
                    } else if (e.key === 'Escape') {
                      setNewCategoryName('')
                      setShowCategoryInput(false)
                    }
                  }}
                />
                <button onClick={() => {
                  if (newCategoryName.trim()) {
                    const colors = ['#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
                    setCategories(prev => [...prev, {
                      id: `cat-${Date.now()}`,
                      name: newCategoryName.trim(),
                      color: colors[prev.length % colors.length]
                    }])
                    setNewCategoryName('')
                    setShowCategoryInput(false)
                  }
                }}>✓</button>
                <button onClick={() => {
                  setNewCategoryName('')
                  setShowCategoryInput(false)
                }}>✕</button>
              </div>
            )}

            {/* 이미지 업로드 영역 */}
            <div
              className="asset-upload-zone"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('dragging')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('dragging')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('dragging')
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const url = event.target?.result as string
                    setAssets(prev => [{
                      id: `asset-${Date.now()}`,
                      url,
                      prompt: '업로드된 이미지',
                      timestamp: Date.now(),
                      category: selectedCategory === 'default' ? 'default' : selectedCategory
                    }, ...prev].slice(0, 50))
                  }
                  reader.readAsDataURL(file)
                }
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.multiple = true
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) {
                    Array.from(files).forEach((file, idx) => {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const url = event.target?.result as string
                        setAssets(prev => [{
                          id: `asset-${Date.now()}-${idx}`,
                          url,
                          prompt: '업로드된 이미지',
                          timestamp: Date.now(),
                          category: selectedCategory === 'default' ? 'default' : selectedCategory
                        }, ...prev].slice(0, 50))
                      }
                      reader.readAsDataURL(file)
                    })
                  }
                }
                input.click()
              }}
            >
              <span>📁 이미지 업로드</span>
              <span className="upload-hint">클릭 또는 드래그 (다중 선택 가능)</span>
            </div>

            {/* 필터링된 어셋 목록 */}
            {(() => {
              const filteredAssets = selectedCategory === 'default'
                ? assets
                : assets.filter(a => a.category === selectedCategory)
              return filteredAssets.length === 0 ? (
                <div className="asset-sidebar-empty">
                  <p>
                    {selectedCategory === 'default'
                      ? '생성된 이미지가\n여기에 저장됩니다'
                      : `'${categories.find(c => c.id === selectedCategory)?.name}' 카테고리가\n비어있습니다`}
                  </p>
                </div>
              ) : (
                <div className="asset-sidebar-list">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="asset-sidebar-item"
                      title={`${asset.prompt}\n드래그하여 캔버스에 추가`}
                      draggable
                      onDragStart={(e) => {
                        const data = JSON.stringify({
                          type: 'asset',
                          url: asset.url,
                          prompt: asset.prompt
                        })
                        e.dataTransfer.setData('application/json', data)
                        e.dataTransfer.setData('text/plain', data)
                        e.dataTransfer.effectAllowed = 'copyMove'
                        // 드래그 이미지 설정
                        const img = e.currentTarget.querySelector('img')
                        if (img) {
                          e.dataTransfer.setDragImage(img, 50, 50)
                        }
                      }}
                    >
                      <img src={asset.url} alt="asset" draggable={false} />
                      <div className="asset-sidebar-actions">
                        {/* 카테고리 변경 드롭다운 */}
                        <select
                          value={asset.category}
                          onChange={(e) => {
                            setAssets(prev => prev.map(a =>
                              a.id === asset.id ? { ...a, category: e.target.value } : a
                            ))
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title="카테고리 변경"
                          className="asset-category-select"
                        >
                          {categories.filter(c => c.id !== 'default').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = asset.url
                            link.download = `asset-${asset.timestamp}.png`
                            link.click()
                          }}
                          title="다운로드"
                        >
                          ⬇
                        </button>
                        <button
                          onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))}
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            {assets.length > 0 && (
              <button
                className="asset-clear-all"
                onClick={() => setAssets([])}
              >
                전체 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Workspace() {
  return (
    <WorkspaceErrorBoundary>
      <ReactFlowProvider>
        <WorkspaceCanvas />
      </ReactFlowProvider>
    </WorkspaceErrorBoundary>
  )
}
