import { Node, Edge } from 'reactflow'

// 보드 타입
export interface Board {
  id: string
  name: string
  parentId: string | null
  nodes: Node[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}

// 워크스페이스 데이터
export interface WorkspaceData {
  boards: { [key: string]: Board }
  currentBoardId: string
  tray: TrayItem[]
}

// 트레이 아이템
export interface TrayItem {
  id: string
  type: 'image' | 'note' | 'text' | 'shape' | 'board'
  data: ImageNodeData | NoteNodeData | TextNodeData | ShapeNodeData | BoardNodeData
  createdAt: number
}

// 노드 데이터 타입들
export interface ImageNodeData {
  imageUrl: string
  label: string
  width?: number
  height?: number
}

export interface NoteNodeData {
  content: string
  backgroundColor?: string
}

export interface TextNodeData {
  text: string
  fontSize?: number
  color?: string
}

export interface ShapeNodeData {
  shape: 'rectangle' | 'circle' | 'triangle'
  backgroundColor?: string
  width?: number
  height?: number
}

export interface BoardNodeData {
  boardId: string
  name: string
  color?: string
  itemCount?: number
  onNameChange?: (boardId: string, newName: string) => void
}

// AI 생성기 노드 데이터
export interface AIGeneratorNodeData {
  apiKey?: string
  model?: string
  prompt?: string
  onGenerate?: (imageUrl: string, label: string) => void
  connectedPrompt?: string
  connectedReferences?: { type: string; image: string; strength: number }[]
}

// 프롬프트 노드 데이터
export interface PromptBuilderNodeData {
  combinedPrompt?: string
  onPromptChange?: (prompt: string) => void
}

export interface SinglePromptNodeData extends PromptBuilderNodeData {
  promptType: 'scene' | 'character' | 'props'
}

// 참조 노드 데이터
export type ReferenceType = 'pose' | 'character' | 'style' | 'composition' | 'background' | 'object'

export interface ReferenceNodeData {
  referenceType: ReferenceType
  image?: string
  strength?: number
  selectedOptions?: string[]
}

// 후처리 노드 데이터
export type ProcessType = 'removeBackground' | 'extractLine' | 'materialID' | 'upscale' | 'stylize'

export interface PostProcessNodeData {
  processType: ProcessType
  intensity?: number
  selectedOptions?: string[]
}

// 옵션 타입
export interface NodeOption {
  id: string
  label: string
  prompt: string
}

export interface NodeConfig {
  title: string
  color: string
  options: NodeOption[]
}

// 카테고리 타입
export interface CategoryData {
  title: string
  options: NodeOption[]
}

export interface PromptCategoryData {
  [key: string]: CategoryData
}
