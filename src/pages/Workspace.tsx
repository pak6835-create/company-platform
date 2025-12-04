import { useState, useCallback, useRef } from 'react'
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
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Workspace.css'

// 워크스페이스 모듈 import
import { nodeTypes } from '../workspace/components'
import { useWorkspace } from '../workspace/hooks'
import { NOTE_COLORS, SHAPE_COLORS } from '../workspace/config'
import { Board, WorkspaceData } from '../workspace/types'
import { saveWorkspaceData } from '../workspace/utils'

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
    trayItems,
    getBreadcrumbs,
    navigateToBoard,
    boardNameChangeRef,
    removeFromTray,
    getNewNodeId,
  } = useWorkspace()

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [showTray, setShowTray] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

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
            style: { width: 320, height: 400 },
          }
          break
        case 'promptScene':
          newNode = {
            id: getNewNodeId(),
            type: 'promptScene',
            position,
            data: { promptType: 'scene' },
            style: { width: 300, height: 350 },
          }
          break
        case 'promptCharacter':
          newNode = {
            id: getNewNodeId(),
            type: 'promptCharacter',
            position,
            data: { promptType: 'character' },
            style: { width: 300, height: 350 },
          }
          break
        case 'promptProps':
          newNode = {
            id: getNewNodeId(),
            type: 'promptProps',
            position,
            data: { promptType: 'props' },
            style: { width: 300, height: 350 },
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
        case 'postProcess':
          newNode = {
            id: getNewNodeId(),
            type: 'postProcess',
            position,
            data: { processType: 'removeBackground', intensity: 1.0, selectedOptions: [] },
            style: { width: 280, height: 300 },
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
            {/* AI 도구 */}
            <div className="add-section">
              <h4>AI 생성</h4>
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
              </div>
            </div>

            {/* 프롬프트 빌더 */}
            <div className="add-section">
              <h4>프롬프트 빌더</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item prompt-scene-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'promptScene')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎬</span>
                  <span>장면</span>
                </div>
                <div
                  className="draggable-item prompt-character-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'promptCharacter')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🧑</span>
                  <span>캐릭터</span>
                </div>
                <div
                  className="draggable-item prompt-props-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'promptProps')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🎒</span>
                  <span>소품</span>
                </div>
              </div>
            </div>

            {/* 이미지 참조 */}
            <div className="add-section">
              <h4>이미지 참조</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item reference-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'reference')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">🖼️</span>
                  <span>이미지 참조</span>
                </div>
              </div>
            </div>

            {/* 후처리 */}
            <div className="add-section">
              <h4>후처리</h4>
              <div className="draggable-items">
                <div
                  className="draggable-item postprocess-drag"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow-type', 'postProcess')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <span className="drag-icon">✨</span>
                  <span>후처리</span>
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
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 하단 트레이 */}
      {trayItems.length > 0 && showTray && (
        <div className="bottom-tray">
          <div className="tray-header">
            <span className="tray-title">📎 트레이</span>
            <span className="tray-count">{trayItems.length}</span>
            <button className="tray-toggle" onClick={() => setShowTray(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="tray-items">
            {trayItems.map((item) => (
              <div key={item.id} className="tray-item">
                {item.type === 'image' && (
                  <img
                    src={(item.data as { imageUrl: string }).imageUrl}
                    alt="tray item"
                    className="tray-item-image"
                  />
                )}
                {item.type === 'note' && (
                  <div
                    className="tray-item-note"
                    style={{ backgroundColor: (item.data as { backgroundColor?: string }).backgroundColor }}
                  />
                )}
                {item.type === 'board' && (
                  <div className="tray-item-board">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                )}
                <button className="tray-item-remove" onClick={() => removeFromTray(item.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 트레이 열기 버튼 */}
      {trayItems.length > 0 && !showTray && (
        <button className="tray-open-btn" onClick={() => setShowTray(true)}>
          📎 트레이 ({trayItems.length})
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
