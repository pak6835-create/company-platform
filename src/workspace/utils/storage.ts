import { WorkspaceData, Board } from '../types'

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

// 데이터 저장
export const saveWorkspaceData = (data: WorkspaceData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save workspace data:', e)
  }
}
