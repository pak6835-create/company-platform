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
  // 어셋은 메모리에만 저장 (base64 이미지가 너무 커서 localStorage 용량 초과)
  const [assets, setAssets] = useState<Asset[]>([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  // 어셋 추가 이벤트 리스너
  useEffect(() => {
    const handleAssetAdd = (e: Event) => {
      const { url, prompt, timestamp } = (e as CustomEvent).detail
      setAssets(prev => [
        { id: `asset-${timestamp}`, url, prompt, timestamp },
        ...prev
      ].slice(0, 10)) // 최대 10개로 제한 (메모리 절약)
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

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        redo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelectedNodes()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteNodes()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copySelectedNodes, pasteNodes, setNodes])

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
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
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
            id: getNewNodeId(),
            type: 'aiGenerator',
            position,
            data: {
              onGenerate: (imageUrl: string, label: string) => {
                addImageToCanvas(imageUrl, label)
              },
            },
            style: { width: 650, height: 600 },
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
            data: { prompt: 'a cute cartoon cat sitting, simple design' },
            style: { width: 380, height: 600 },
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

      {/* 오른쪽 어셋 라이브러리 사이드바 */}
      <div className={`asset-sidebar ${showAssetLibrary ? 'open' : ''}`}>
        <div className="asset-sidebar-header">
          <h3>🖼️ 어셋 ({assets.length})</h3>
          <button onClick={() => setShowAssetLibrary(!showAssetLibrary)}>
            {showAssetLibrary ? '→' : '←'}
          </button>
        </div>
        {showAssetLibrary && (
          <div className="asset-sidebar-content">
            {assets.length === 0 ? (
              <div className="asset-sidebar-empty">
                <p>생성된 이미지가<br/>여기에 저장됩니다</p>
              </div>
            ) : (
              <div className="asset-sidebar-list">
                {assets.map((asset) => (
                  <div key={asset.id} className="asset-sidebar-item" title={asset.prompt}>
                    <img src={asset.url} alt="asset" />
                    <div className="asset-sidebar-actions">
                      <button
                        onClick={() => {
                          const position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
                          const newNode: Node = {
                            id: getNewNodeId(),
                            type: 'image',
                            position,
                            data: { imageUrl: asset.url, label: asset.prompt?.slice(0, 20) || 'AI 생성' },
                            style: { width: 200, height: 200 },
                          }
                          setNodes(nds => [...nds, newNode])
                        }}
                        title="캔버스에 추가"
                      >
                        +
                      </button>
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
            )}
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
