import { WorkspaceData } from '../types'

const STORAGE_KEY = 'workspace_data'

// 초기 데이터 생성
export const createInitialData = (): WorkspaceData => ({
  boards: {
    home: {
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
    },
  },
  currentBoardId: 'home',
  tray: [],
})

// 데이터 로드
export const loadWorkspaceData = (): WorkspaceData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      // 필수 필드 검증
      if (!data.boards || !data.currentBoardId || !data.boards[data.currentBoardId]) {
        console.warn('Invalid workspace data, resetting...')
        localStorage.removeItem(STORAGE_KEY)
        return createInitialData()
      }
      if (!data.tray) data.tray = []
      // 각 보드의 nodes와 edges가 배열인지 확인
      Object.keys(data.boards).forEach((boardId) => {
        const board = data.boards[boardId]
        if (!Array.isArray(board.nodes)) board.nodes = []
        if (!Array.isArray(board.edges)) board.edges = []
      })
      return data
    }
  } catch (e) {
    console.error('Failed to load workspace data:', e)
    localStorage.removeItem(STORAGE_KEY)
  }
  return createInitialData()
}

// 노드 데이터에서 큰 base64 이미지 제거 (저장 용량 절약)
const sanitizeNodeData = (node: Record<string, unknown>) => {
  const sanitized = { ...node }
  if (sanitized.data && typeof sanitized.data === 'object') {
    const data = { ...(sanitized.data as Record<string, unknown>) }
    // base64 이미지 데이터 필터링 (10KB 이상)
    Object.keys(data).forEach((key) => {
      const value = data[key]
      if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 10000) {
        data[key] = '' // 큰 이미지 데이터 제거
      }
    })
    sanitized.data = data
  }
  return sanitized
}

// 데이터 저장 (큰 이미지 제외)
export const saveWorkspaceData = (data: WorkspaceData) => {
  try {
    // 저장 전 큰 이미지 데이터 제거
    const sanitizedData = {
      ...data,
      boards: Object.fromEntries(
        Object.entries(data.boards).map(([id, board]) => [
          id,
          {
            ...board,
            nodes: board.nodes.map((node) => sanitizeNodeData(node as Record<string, unknown>)),
          },
        ])
      ),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedData))
  } catch (e) {
    console.error('Failed to save workspace data:', e)
    // 용량 초과 시 오래된 보드 정리 시도
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old data...')
      try {
        // 현재 보드만 저장
        const minimalData = {
          ...data,
          boards: {
            [data.currentBoardId]: data.boards[data.currentBoardId],
          },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData))
      } catch {
        // 그래도 실패하면 초기화
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }
}
