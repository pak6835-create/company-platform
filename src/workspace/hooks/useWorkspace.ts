import { useState, useCallback, useRef, useEffect } from 'react'
import { Node, Edge, useNodesState, useEdgesState, useReactFlow } from 'reactflow'
import { WorkspaceData, Board, TrayItem } from '../types'
import { loadWorkspaceData, saveWorkspaceData } from '../utils/storage'

export function useWorkspace() {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(loadWorkspaceData)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const nodeIdCounter = useRef(Date.now())
  const prevBoardIdRef = useRef<string | null>(null)
  const boardNameChangeRef = useRef<(boardId: string, newName: string) => void>()

  // 현재 보드
  const currentBoard = workspaceData.boards[workspaceData.currentBoardId]
  const trayItems = workspaceData.tray || []

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

  // 보드로 이동
  const navigateToBoard = useCallback((boardId: string) => {
    // 현재 보드 저장
    const updated = {
      ...workspaceData,
      boards: {
        ...workspaceData.boards,
        [workspaceData.currentBoardId]: {
          ...workspaceData.boards[workspaceData.currentBoardId],
          nodes,
          edges,
          updatedAt: Date.now(),
        },
      },
      currentBoardId: boardId,
    }
    setWorkspaceData(updated)
    saveWorkspaceData(updated)
  }, [workspaceData, nodes, edges])

  // 보드 이름 변경
  const handleBoardNameChange = useCallback((boardId: string, newName: string) => {
    const board = workspaceData.boards[boardId]
    if (!board) return

    const updatedBoards = {
      ...workspaceData.boards,
      [boardId]: { ...board, name: newName, updatedAt: Date.now() },
    }

    // 현재 보드의 노드 중 해당 보드를 가리키는 노드도 업데이트
    const updatedNodes = nodes.map((node) => {
      if (node.type === 'board' && node.data.boardId === boardId) {
        return { ...node, data: { ...node.data, name: newName } }
      }
      return node
    })

    setNodes(updatedNodes)
    const updated = { ...workspaceData, boards: updatedBoards }
    setWorkspaceData(updated)
    saveWorkspaceData(updated)
  }, [workspaceData, nodes, setNodes])

  // boardNameChangeRef 설정
  useEffect(() => {
    boardNameChangeRef.current = handleBoardNameChange
  }, [handleBoardNameChange])

  // 보드 로드
  useEffect(() => {
    if (prevBoardIdRef.current !== workspaceData.currentBoardId) {
      prevBoardIdRef.current = workspaceData.currentBoardId
      if (currentBoard) {
        const updatedNodes = currentBoard.nodes.map((node) => {
          if (node.type === 'board' && node.data.boardId) {
            const targetBoard = workspaceData.boards[node.data.boardId]
            const itemCount = targetBoard ? targetBoard.nodes.length : 0
            return {
              ...node,
              data: {
                ...node.data,
                itemCount,
                onNameChange: (id: string, name: string) => {
                  boardNameChangeRef.current?.(id, name)
                },
              },
            }
          }
          return node
        })
        setNodes(updatedNodes)
        setEdges(currentBoard.edges)
      }
    }
  }, [workspaceData, currentBoard, setNodes, setEdges])

  // 노드/엣지 변경 시 자동 저장
  useEffect(() => {
    if (prevBoardIdRef.current === workspaceData.currentBoardId && currentBoard) {
      const updated = {
        ...workspaceData,
        boards: {
          ...workspaceData.boards,
          [workspaceData.currentBoardId]: {
            ...currentBoard,
            nodes,
            edges,
            updatedAt: Date.now(),
          },
        },
      }
      saveWorkspaceData(updated)
    }
  }, [nodes, edges])

  // 트레이에 아이템 추가
  const addToTray = useCallback((item: Omit<TrayItem, 'id' | 'createdAt'>) => {
    const newItem: TrayItem = {
      ...item,
      id: `tray-${Date.now()}`,
      createdAt: Date.now(),
    } as TrayItem
    const updated = {
      ...workspaceData,
      tray: [...workspaceData.tray, newItem],
    }
    setWorkspaceData(updated)
    saveWorkspaceData(updated)
  }, [workspaceData])

  // 트레이에서 아이템 제거
  const removeFromTray = useCallback((itemId: string) => {
    const updated = {
      ...workspaceData,
      tray: workspaceData.tray.filter((item) => item.id !== itemId),
    }
    setWorkspaceData(updated)
    saveWorkspaceData(updated)
  }, [workspaceData])

  // 새 노드 ID 생성
  const getNewNodeId = useCallback(() => {
    return String(nodeIdCounter.current++)
  }, [])

  return {
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
    handleBoardNameChange,
    boardNameChangeRef,
    addToTray,
    removeFromTray,
    getNewNodeId,
    saveWorkspaceData: () => saveWorkspaceData(workspaceData),
  }
}
