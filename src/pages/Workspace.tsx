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

// 컨텍스트 메뉴 타입
interface ContextMenu {
  x: number
  y: number
  type: 'canvas' | 'node'
  nodeId?: string
  nodeData?: {
    imageUrl?: string
    prompt?: string
  }
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
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
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
  // 라이브러리 어셋 컨텍스트 메뉴
  const [assetContextMenu, setAssetContextMenu] = useState<{
    x: number
    y: number
    asset: Asset
  } | null>(null)
  // 이미지 팝업 상태
  const [imagePopup, setImagePopup] = useState<{
    url: string
    prompt?: string
  } | null>(null)
  // 줌 레벨
  const [zoomLevel, setZoomLevel] = useState(1)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  // 그룹 선택 시 자식 노드도 함께 선택하는 핸들러
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      // 먼저 기본 변경 적용
      onNodesChange(changes)

      // 선택 변경이 있는지 확인
      const selectionChanges = changes.filter(
        (c: any) => c.type === 'select' && c.selected === true
      )

      if (selectionChanges.length > 0) {
        // 선택된 그룹 노드 찾기
        const selectedGroupIds = selectionChanges
          .map((c: any) => nodes.find(n => n.id === c.id))
          .filter((n: any) => n?.type === 'group')
          .map((n: any) => n.id)

        if (selectedGroupIds.length > 0) {
          // 그룹의 자식 노드들도 선택
          setNodes((nds) =>
            nds.map((n) => {
              if (selectedGroupIds.includes(n.parentNode)) {
                return { ...n, selected: true }
              }
              return n
            })
          )
        }
      }
    },
    [onNodesChange, nodes, setNodes]
  )

  // 어셋 추가 이벤트 리스너
  useEffect(() => {
    const handleAssetAdd = (e: Event) => {
      const { url, prompt, timestamp, category } = (e as CustomEvent).detail
      console.log('[Workspace] asset-add 이벤트 수신:', url?.slice(0, 50))
      setAssets(prev => [
        { id: `asset-${timestamp}`, url, prompt, timestamp, category: category || 'default' },
        ...prev
      ].slice(0, 50)) // 최대 50개로 제한
    }
    window.addEventListener('asset-add', handleAssetAdd)
    console.log('[Workspace] asset-add 이벤트 리스너 등록')
    return () => window.removeEventListener('asset-add', handleAssetAdd)
  }, [])

  // 어셋 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => setAssetContextMenu(null)
    if (assetContextMenu) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [assetContextMenu])

  // 프롬프트를 카테고리별로 파싱하는 함수
  const parsePromptByCategory = useCallback((prompt: string) => {
    const categories: Record<string, string> = {
      '전체': prompt,
      '캐릭터 상세': '',
      '머리카락': '',
      '의상': '',
      '악세서리': '',
      '무기': '',
      '아트 스타일': '',
      '배경': '',
    }

    // Character Details 섹션 추출
    const charMatch = prompt.match(/Character Details:\n([\s\S]*?)(?=\n\nHair:|$)/)
    if (charMatch) categories['캐릭터 상세'] = charMatch[1].trim()

    // Hair 섹션 추출
    const hairMatch = prompt.match(/Hair:\s*([^\n]+)/)
    if (hairMatch) categories['머리카락'] = hairMatch[1].trim()

    // Outfit 섹션 추출
    const outfitMatch = prompt.match(/Outfit:\s*([^\n]+)/)
    if (outfitMatch) categories['의상'] = outfitMatch[1].trim()

    // Accessories 섹션 추출
    const accMatch = prompt.match(/Accessories:\s*([^\n]+)/)
    if (accMatch) categories['악세서리'] = accMatch[1].trim()

    // Weapon 섹션 추출
    const weaponMatch = prompt.match(/Weapon:\s*([^\n]+)/)
    if (weaponMatch) categories['무기'] = weaponMatch[1].trim()

    // Art Style 섹션 추출
    const styleMatch = prompt.match(/Art Style:\s*([^\n]+)/)
    if (styleMatch) categories['아트 스타일'] = styleMatch[1].trim()

    // Background 섹션 추출
    const bgMatch = prompt.match(/Background:\s*([^\n]+)/)
    if (bgMatch) categories['배경'] = bgMatch[1].trim()

    return categories
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

  // 선택된 노드 그룹화 (parentNode 설정)
  const groupSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group')
    if (selectedNodes.length < 2) return // 2개 이상 선택해야 그룹화 가능

    // 그룹 노드 생성 - 선택된 노드들의 영역을 감싸는 크기로
    const minX = Math.min(...selectedNodes.map(n => n.position.x))
    const minY = Math.min(...selectedNodes.map(n => n.position.y))
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + ((n.style?.width as number) || 200)))
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + ((n.style?.height as number) || 150)))

    const padding = 20
    const groupId = getNewNodeId()
    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        border: '2px dashed #3b82f6',
        borderRadius: '12px',
      },
      data: { label: '그룹' },
      selectable: true,
      draggable: true,
    }

    // 선택된 노드들을 그룹의 자식으로 설정
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (selectedNodes.find(s => s.id === n.id)) {
          return {
            ...n,
            parentNode: groupId,
            extent: 'parent' as const,
            position: {
              x: n.position.x - groupNode.position.x,
              y: n.position.y - groupNode.position.y,
            },
            selected: false,
          }
        }
        return n
      })
      return [groupNode, ...updatedNodes]
    })
  }, [nodes, getNewNodeId, setNodes])

  // 그룹 해제
  const ungroupSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    const groupNode = selectedNodes.find(n => n.type === 'group')
    if (!groupNode) return

    // 그룹의 자식 노드들을 찾아서 그룹 해제
    setNodes((nds) => {
      return nds
        .filter(n => n.id !== groupNode.id) // 그룹 노드 제거
        .map((n) => {
          if (n.parentNode === groupNode.id) {
            return {
              ...n,
              parentNode: undefined,
              extent: undefined,
              position: {
                x: n.position.x + groupNode.position.x,
                y: n.position.y + groupNode.position.y,
              },
            }
          }
          return n
        })
    })
  }, [nodes, setNodes])

  // 그룹 크기 업데이트 헬퍼 함수
  const updateGroupSize = useCallback((nds: Node[], groupId: string) => {
    const childNodes = nds.filter(n => n.parentNode === groupId)
    if (childNodes.length === 0) return nds

    const padding = 20
    const minX = Math.min(...childNodes.map(n => n.position.x))
    const minY = Math.min(...childNodes.map(n => n.position.y))
    const maxX = Math.max(...childNodes.map(n => n.position.x + ((n.style?.width as number) || 200)))
    const maxY = Math.max(...childNodes.map(n => n.position.y + ((n.style?.height as number) || 150)))

    return nds.map(n => {
      if (n.id === groupId) {
        return {
          ...n,
          style: {
            ...n.style,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
          }
        }
      }
      // 자식 노드 위치 조정 (minX, minY를 padding으로)
      if (n.parentNode === groupId) {
        return {
          ...n,
          position: {
            x: n.position.x - minX + padding,
            y: n.position.y - minY + padding,
          }
        }
      }
      return n
    })
  }, [])

  // 선택된 노드들 세로 정렬
  const alignVertical = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group')
    if (selectedNodes.length < 2) return

    const gap = 20
    const padding = 20
    const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y)

    // 그룹 내부 노드인지 확인
    const parentId = selectedNodes[0].parentNode
    const allSameParent = selectedNodes.every(n => n.parentNode === parentId)

    setNodes((nds) => {
      // 시작 위치 계산
      const startX = padding
      let currentY = padding

      let updatedNodes = nds.map((n) => {
        const idx = sorted.findIndex(s => s.id === n.id)
        if (idx !== -1) {
          const y = currentY
          currentY += ((n.style?.height as number) || 150) + gap
          return { ...n, position: { x: startX, y } }
        }
        return n
      })

      // 그룹 내부 노드면 그룹 크기 업데이트
      if (allSameParent && parentId) {
        updatedNodes = updateGroupSize(updatedNodes, parentId)
      }

      return updatedNodes
    })
  }, [nodes, setNodes, updateGroupSize])

  // 선택된 노드들 가로 정렬
  const alignHorizontal = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group')
    if (selectedNodes.length < 2) return

    const gap = 20
    const padding = 20
    const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x)

    // 그룹 내부 노드인지 확인
    const parentId = selectedNodes[0].parentNode
    const allSameParent = selectedNodes.every(n => n.parentNode === parentId)

    setNodes((nds) => {
      const startY = padding
      let currentX = padding

      let updatedNodes = nds.map((n) => {
        const idx = sorted.findIndex(s => s.id === n.id)
        if (idx !== -1) {
          const x = currentX
          currentX += ((n.style?.width as number) || 200) + gap
          return { ...n, position: { x, y: startY } }
        }
        return n
      })

      // 그룹 내부 노드면 그룹 크기 업데이트
      if (allSameParent && parentId) {
        updatedNodes = updateGroupSize(updatedNodes, parentId)
      }

      return updatedNodes
    })
  }, [nodes, setNodes, updateGroupSize])

  // 선택된 노드들 그리드 정렬 (최대 5열) - 노드 크기에 맞춰 딱 붙게 정렬
  const alignGrid = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group')
    if (selectedNodes.length < 2) return

    const maxCols = 5
    const gap = 15
    const padding = 20

    // 기존 위치 순서대로 정렬
    const sorted = [...selectedNodes].sort((a, b) => {
      const rowA = Math.floor(a.position.y / 100)
      const rowB = Math.floor(b.position.y / 100)
      if (rowA !== rowB) return rowA - rowB
      return a.position.x - b.position.x
    })

    // 노드 타입별 기본 크기
    const getNodeSize = (n: Node) => {
      if (n.style?.width && n.style?.height) {
        return { width: n.style.width as number, height: n.style.height as number }
      }
      switch (n.type) {
        case 'image': return { width: 200, height: 200 }
        case 'note': return { width: 180, height: 120 }
        case 'text': return { width: 150, height: 40 }
        case 'shape': return { width: 100, height: 100 }
        default: return { width: 200, height: 150 }
      }
    }

    // 각 노드의 크기 미리 계산
    const sortedWithSize = sorted.map(n => ({ node: n, size: getNodeSize(n) }))

    // 행 수 계산
    const rowCount = Math.ceil(sorted.length / maxCols)

    // 각 행의 최대 높이 계산
    const rowHeights: number[] = []
    for (let row = 0; row < rowCount; row++) {
      const rowNodes = sortedWithSize.slice(row * maxCols, (row + 1) * maxCols)
      const maxHeight = Math.max(...rowNodes.map(item => item.size.height))
      rowHeights.push(maxHeight)
    }

    // 각 열의 최대 너비 계산
    const colWidths: number[] = []
    for (let col = 0; col < maxCols; col++) {
      const colNodes = sortedWithSize.filter((_, idx) => idx % maxCols === col)
      if (colNodes.length > 0) {
        const maxWidth = Math.max(...colNodes.map(item => item.size.width))
        colWidths.push(maxWidth)
      }
    }

    // 그룹 내부 노드인지 확인
    const parentId = selectedNodes[0].parentNode
    const allSameParent = selectedNodes.every(n => n.parentNode === parentId)

    setNodes((nds) => {
      let updatedNodes = nds.map((n) => {
        const idx = sorted.findIndex(s => s.id === n.id)
        if (idx !== -1) {
          const col = idx % maxCols
          const row = Math.floor(idx / maxCols)

          // x 위치: 이전 열들의 너비 합 + gap
          let x = padding
          for (let c = 0; c < col; c++) {
            x += colWidths[c] + gap
          }

          // y 위치: 이전 행들의 높이 합 + gap
          let y = padding
          for (let r = 0; r < row; r++) {
            y += rowHeights[r] + gap
          }

          return { ...n, position: { x, y } }
        }
        return n
      })

      // 그룹 내부 노드면 그룹 크기 업데이트
      if (allSameParent && parentId) {
        updatedNodes = updateGroupSize(updatedNodes, parentId)
      }

      return updatedNodes
    })
  }, [nodes, setNodes, updateGroupSize])

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
      // Escape: 선택 해제 / 팝업 닫기
      if (e.key === 'Escape') {
        e.preventDefault()
        if (imagePopup) {
          setImagePopup(null)
        } else {
          setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
          setShowAddPanel(false)
        }
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
      // Ctrl+G: 그룹화
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        groupSelectedNodes()
      }
      // Ctrl+Shift+G: 그룹 해제
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        ungroupSelectedNodes()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copySelectedNodes, pasteNodes, setNodes, setEdges, nodes, groupSelectedNodes, ungroupSelectedNodes, imagePopup])

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
    // effectAllowed에 맞춰 dropEffect 설정
    const effectAllowed = event.dataTransfer.effectAllowed
    if (effectAllowed === 'move' || effectAllowed === 'copyMove') {
      event.dataTransfer.dropEffect = 'move'
    } else {
      event.dataTransfer.dropEffect = 'copy'
    }
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

      // 로컬 파일 드롭 처리 (여러 이미지 지원, 최대 10개)
      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        const allImageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        const imageFiles = allImageFiles.slice(0, 10)
        // 최대 개수 초과 시 안내
        if (allImageFiles.length > 10) {
          alert(`이미지는 한 번에 최대 10개까지만 추가할 수 있습니다.\n${allImageFiles.length}개 중 10개만 추가됩니다.`)
        }
        if (imageFiles.length > 0) {
          imageFiles.forEach((file, index) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string
              const newNode: Node = {
                id: getNewNodeId(),
                type: 'image',
                position: {
                  x: position.x + (index % 5) * 220,
                  y: position.y + Math.floor(index / 5) * 220,
                },
                data: { imageUrl: dataUrl, label: file.name.slice(0, 20) || '업로드 이미지' },
                style: { width: 200, height: 200 },
              }
              setNodes((nds) => [...nds, newNode])
            }
            reader.readAsDataURL(file)
          })
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

  // 노드 더블클릭 핸들러 (보드, 이미지)
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'board' && node.data.boardId) {
        navigateToBoard(node.data.boardId)
      } else if (node.type === 'image' && node.data.imageUrl) {
        // 이미지 노드 더블클릭 시 팝업 열기
        setImagePopup({
          url: node.data.imageUrl,
          prompt: node.data.prompt || node.data.label
        })
      }
    },
    [navigateToBoard]
  )

  // 선택된 노드 삭제
  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  // 캔버스 우클릭 핸들러
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      if (!reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'canvas',
        nodeData: { imageUrl: undefined, prompt: undefined },
      })
    },
    [reactFlowInstance]
  )

  // 선택 영역 우클릭 핸들러 (여러 노드 선택 후 우클릭)
  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'canvas', // 캔버스 타입으로 설정해서 그룹화 메뉴 표시
        nodeData: { imageUrl: undefined, prompt: undefined },
      })
    },
    []
  )

  // 노드 우클릭 핸들러
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      event.stopPropagation()

      // 그룹 노드 우클릭 시 자식 노드들도 선택
      if (node.type === 'group') {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id || n.parentNode === node.id) {
              return { ...n, selected: true }
            }
            return n
          })
        )
        // 그룹은 캔버스 타입 메뉴로 표시 (그룹화/정렬 메뉴)
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          type: 'canvas',
          nodeData: { imageUrl: undefined, prompt: undefined },
        })
      } else {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          type: 'node',
          nodeId: node.id,
          nodeData: {
            imageUrl: node.data?.imageUrl || node.data?.resultImage || node.data?.generatedImage,
            prompt: node.data?.prompt || node.data?.label,
          },
        })
      }
    },
    [setNodes]
  )

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // 노드 삭제 (컨텍스트 메뉴)
  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu?.nodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId))
    }
    closeContextMenu()
  }, [contextMenu, setNodes, setEdges, closeContextMenu])

  // 라이브러리에 추가 (컨텍스트 메뉴) - 다중 선택 지원
  const handleAddToLibrary = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    const imageNodes = selectedNodes.filter(n => n.data?.imageUrl)

    if (imageNodes.length > 0) {
      // 다중 선택된 이미지 노드들 추가
      const newAssets = imageNodes.map((node, idx) => ({
        id: `asset-${Date.now()}-${idx}`,
        url: node.data.imageUrl as string,
        prompt: (node.data.prompt as string) || '화이트보드에서 추가',
        timestamp: Date.now() + idx,
        category: selectedCategory === 'default' ? 'default' : selectedCategory
      }))
      setAssets(prev => [...newAssets, ...prev].slice(0, 50))
    } else if (contextMenu?.nodeData?.imageUrl) {
      // 단일 노드 (우클릭한 노드)
      setAssets(prev => [{
        id: `asset-${Date.now()}`,
        url: contextMenu.nodeData!.imageUrl!,
        prompt: contextMenu.nodeData?.prompt || '화이트보드에서 추가',
        timestamp: Date.now(),
        category: selectedCategory === 'default' ? 'default' : selectedCategory
      }, ...prev].slice(0, 50))
    }
    closeContextMenu()
  }, [contextMenu, selectedCategory, closeContextMenu, nodes])

  // 프롬프트 복사 (컨텍스트 메뉴)
  const handleCopyPrompt = useCallback(() => {
    if (contextMenu?.nodeData?.prompt) {
      navigator.clipboard.writeText(contextMenu.nodeData.prompt)
        .then(() => {
          // 복사 성공 알림 (간단히 console.log)
          console.log('프롬프트가 복사되었습니다:', contextMenu.nodeData?.prompt)
        })
        .catch((err) => {
          console.error('복사 실패:', err)
        })
    }
    closeContextMenu()
  }, [contextMenu, closeContextMenu])

  // 캔버스에 노드 추가 (컨텍스트 메뉴)
  const handleContextMenuAddNode = useCallback((nodeType: string) => {
    if (!reactFlowWrapper.current || !contextMenu) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = reactFlowInstance.screenToFlowPosition({
      x: contextMenu.x - bounds.left,
      y: contextMenu.y - bounds.top,
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
          style: { width: 900, height: 700 },
        }
        break
      case 'note':
        newNode = {
          id: getNewNodeId(),
          type: 'note',
          position,
          data: { content: '새 노트\n\n더블클릭하여 편집', backgroundColor: '#fef3c7' },
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
        closeContextMenu()
        return
    }

    setNodes((nds) => [...nds, newNode])
    closeContextMenu()
  }, [contextMenu, reactFlowInstance, getNewNodeId, addImageToCanvas, setNodes, closeContextMenu])

  // 전역 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [closeContextMenu])

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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
          onMove={(_, viewport) => setZoomLevel(viewport.zoom)}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          maxZoom={4}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          selectNodesOnDrag
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap />
          {/* 줌 레벨 표시 */}
          <div className="zoom-indicator">
            {Math.round(zoomLevel * 100)}%
          </div>
        </ReactFlow>
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'canvas' ? (
            // 캔버스 우클릭 메뉴
            <>
              {/* 선택된 노드가 있으면 그룹화/정렬 메뉴 먼저 표시 */}
              {nodes.filter(n => n.selected).length >= 2 && (
                <>
                  <div className="context-menu-submenu-title">선택된 노드</div>
                  <div
                    className="context-menu-item"
                    onClick={() => { groupSelectedNodes(); closeContextMenu(); }}
                  >
                    📦 그룹화
                  </div>
                  <div className="context-menu-submenu-title">정렬</div>
                  <div
                    className="context-menu-item"
                    onClick={() => { alignVertical(); closeContextMenu(); }}
                  >
                    ⬇️ 세로 정렬
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() => { alignHorizontal(); closeContextMenu(); }}
                  >
                    ➡️ 가로 정렬
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() => { alignGrid(); closeContextMenu(); }}
                  >
                    ⊞ 그리드 정렬
                  </div>
                  <div className="context-menu-divider" />
                </>
              )}
              <div className="context-menu-submenu-title">노드 추가</div>
              <div
                className="context-menu-item"
                onClick={() => handleContextMenuAddNode('aiGenerator')}
              >
                🎨 캐릭터 메이커
              </div>
              <div
                className="context-menu-item"
                onClick={() => handleContextMenuAddNode('transparentBg')}
              >
                🎭 투명 배경 생성기
              </div>
              <div
                className="context-menu-item"
                onClick={() => handleContextMenuAddNode('poseChange')}
              >
                🕺 포즈 변경
              </div>
              <div className="context-menu-divider" />
              <div
                className="context-menu-item"
                onClick={() => handleContextMenuAddNode('note')}
              >
                📝 노트
              </div>
              <div
                className="context-menu-item"
                onClick={() => handleContextMenuAddNode('text')}
              >
                📄 텍스트
              </div>
            </>
          ) : (
            // 노드 우클릭 메뉴
            <>
              {/* 다중 선택 시 이미지 노드가 있거나, 단일 노드가 이미지인 경우 */}
              {(nodes.filter(n => n.selected && n.data?.imageUrl).length > 0 || contextMenu.nodeData?.imageUrl) && (
                <>
                  <div
                    className="context-menu-item"
                    onClick={handleAddToLibrary}
                  >
                    📚 라이브러리에 추가 {nodes.filter(n => n.selected && n.data?.imageUrl).length > 1 ? `(${nodes.filter(n => n.selected && n.data?.imageUrl).length}개)` : ''}
                  </div>
                </>
              )}
              {contextMenu.nodeData?.prompt && (
                <div
                  className="context-menu-item"
                  onClick={handleCopyPrompt}
                >
                  📋 프롬프트 복사
                </div>
              )}
              {(contextMenu.nodeData?.imageUrl || contextMenu.nodeData?.prompt) && (
                <div className="context-menu-divider" />
              )}
              {/* 그룹화 메뉴 */}
              <div
                className="context-menu-item"
                onClick={() => { groupSelectedNodes(); closeContextMenu(); }}
              >
                📦 그룹화 (Ctrl+G)
              </div>
              <div
                className="context-menu-item"
                onClick={() => { ungroupSelectedNodes(); closeContextMenu(); }}
              >
                📤 그룹 해제
              </div>
              <div className="context-menu-divider" />
              {/* 정렬 메뉴 */}
              <div className="context-menu-submenu-title">정렬</div>
              <div
                className="context-menu-item"
                onClick={() => { alignVertical(); closeContextMenu(); }}
              >
                ⬇️ 세로 정렬
              </div>
              <div
                className="context-menu-item"
                onClick={() => { alignHorizontal(); closeContextMenu(); }}
              >
                ➡️ 가로 정렬
              </div>
              <div
                className="context-menu-item"
                onClick={() => { alignGrid(); closeContextMenu(); }}
              >
                ⊞ 그리드 정렬
              </div>
              <div className="context-menu-divider" />
              <div
                className="context-menu-item context-menu-delete"
                onClick={handleContextMenuDelete}
              >
                🗑️ 삭제
              </div>
            </>
          )}
        </div>
      )}

      {/* 라이브러리 어셋 컨텍스트 메뉴 (카테고리별 프롬프트 복사) */}
      {assetContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: assetContextMenu.x,
            top: assetContextMenu.y,
            zIndex: 10000,
            background: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            minWidth: 180,
            maxHeight: 400,
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 10px', fontSize: 11, color: '#888', borderBottom: '1px solid #333' }}>
            📋 프롬프트 복사
          </div>
          {Object.entries(parsePromptByCategory(assetContextMenu.asset.prompt)).map(([category, content]) => {
            if (!content) return null
            return (
              <div
                key={category}
                className="context-menu-item"
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onClick={() => {
                  navigator.clipboard.writeText(content)
                  setAssetContextMenu(null)
                  console.log(`[${category}] 복사됨:`, content.slice(0, 50) + '...')
                }}
              >
                <span style={{ color: category === '전체' ? '#4ade80' : '#94a3b8' }}>
                  {category === '전체' ? '📄' :
                   category === '캐릭터 상세' ? '👤' :
                   category === '머리카락' ? '💇' :
                   category === '의상' ? '👕' :
                   category === '악세서리' ? '💍' :
                   category === '무기' ? '⚔️' :
                   category === '아트 스타일' ? '🎨' :
                   category === '배경' ? '🖼️' : '📝'}
                </span>
                <span>{category}</span>
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid #333', marginTop: 4, paddingTop: 4 }}>
            <div
              className="context-menu-item"
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                const link = document.createElement('a')
                link.href = assetContextMenu.asset.url
                link.download = `asset-${assetContextMenu.asset.timestamp}.png`
                link.click()
                setAssetContextMenu(null)
              }}
            >
              <span>⬇️</span>
              <span>이미지 다운로드</span>
            </div>
            <div
              className="context-menu-item context-menu-delete"
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                setAssets(prev => prev.filter(a => a.id !== assetContextMenu.asset.id))
                setAssetContextMenu(null)
              }}
            >
              <span>🗑️</span>
              <span>삭제</span>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 팝업 */}
      {imagePopup && (
        <div
          className="image-popup-overlay"
          onClick={() => setImagePopup(null)}
        >
          <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-popup-close"
              onClick={() => setImagePopup(null)}
              title="닫기 (ESC)"
            >
              ×
            </button>
            <img src={imagePopup.url} alt="이미지" />
            {imagePopup.prompt && (
              <div className="image-popup-prompt">
                <span>{imagePopup.prompt}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(imagePopup.prompt || '')
                    alert('프롬프트가 복사되었습니다!')
                  }}
                  title="프롬프트 복사"
                >
                  📋
                </button>
              </div>
            )}
            <div className="image-popup-actions">
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = imagePopup.url
                  link.download = `image-${Date.now()}.png`
                  link.click()
                }}
              >
                ⬇️ 다운로드
              </button>
            </div>
          </div>
        </div>
      )}

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
                const files = e.dataTransfer.files
                if (files && files.length > 0) {
                  // 여러 이미지 한번에 처리 (최대 10개)
                  const allImageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
                  const imageFiles = allImageFiles.slice(0, 10)
                  // 최대 개수 초과 시 안내
                  if (allImageFiles.length > 10) {
                    alert(`이미지는 한 번에 최대 10개까지만 추가할 수 있습니다.\n${allImageFiles.length}개 중 10개만 추가됩니다.`)
                  }
                  imageFiles.forEach((file, idx) => {
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
                      title="더블클릭: 크게 보기 / 우클릭: 프롬프트 복사 메뉴"
                      draggable
                      onDoubleClick={() => setImagePopup({ url: asset.url, prompt: asset.prompt })}
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
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setAssetContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          asset
                        })
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
