// 기본 노드
export { ImageNode } from './ImageNode'
export { NoteNode } from './NoteNode'
export { TextNode } from './TextNode'
export { ShapeNode } from './ShapeNode'
export { BoardNode } from './BoardNode'
export { LinkCardNode } from './LinkCardNode'
export { ChecklistNode } from './ChecklistNode'

// AI 관련 노드
export { AIGeneratorNode } from './AIGeneratorNode'
export { ReferenceNode } from './ReferenceNode'
export { TransparentBgNode } from './TransparentBgNode'
export { PoseChangeNode } from './PoseChangeNode'

// 노드 타입 맵
import { ImageNode } from './ImageNode'
import { NoteNode } from './NoteNode'
import { TextNode } from './TextNode'
import { ShapeNode } from './ShapeNode'
import { BoardNode } from './BoardNode'
import { LinkCardNode } from './LinkCardNode'
import { ChecklistNode } from './ChecklistNode'
import { AIGeneratorNode } from './AIGeneratorNode'
import { ReferenceNode } from './ReferenceNode'
import { TransparentBgNode } from './TransparentBgNode'
import { PoseChangeNode } from './PoseChangeNode'

export const nodeTypes = {
  image: ImageNode,
  note: NoteNode,
  text: TextNode,
  shape: ShapeNode,
  board: BoardNode,
  linkCard: LinkCardNode,
  checklist: ChecklistNode,
  aiGenerator: AIGeneratorNode,
  reference: ReferenceNode,
  transparentBg: TransparentBgNode,
  poseChange: PoseChangeNode,
}
