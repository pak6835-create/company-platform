// 기본 노드
export { ImageNode } from './ImageNode'
export { NoteNode } from './NoteNode'
export { TextNode } from './TextNode'
export { ShapeNode } from './ShapeNode'
export { BoardNode } from './BoardNode'

// AI 관련 노드
export { AIGeneratorNode } from './AIGeneratorNode'
export { PromptSceneNode, PromptCharacterNode, PromptPropsNode } from './PromptNodes'
export { ReferenceNode } from './ReferenceNode'
export { PostProcessNode } from './PostProcessNode'

// 노드 타입 맵
import { ImageNode } from './ImageNode'
import { NoteNode } from './NoteNode'
import { TextNode } from './TextNode'
import { ShapeNode } from './ShapeNode'
import { BoardNode } from './BoardNode'
import { AIGeneratorNode } from './AIGeneratorNode'
import { PromptSceneNode, PromptCharacterNode, PromptPropsNode } from './PromptNodes'
import { ReferenceNode } from './ReferenceNode'
import { PostProcessNode } from './PostProcessNode'

export const nodeTypes = {
  image: ImageNode,
  note: NoteNode,
  text: TextNode,
  shape: ShapeNode,
  board: BoardNode,
  aiGenerator: AIGeneratorNode,
  promptScene: PromptSceneNode,
  promptCharacter: PromptCharacterNode,
  promptProps: PromptPropsNode,
  reference: ReferenceNode,
  postProcess: PostProcessNode,
}
