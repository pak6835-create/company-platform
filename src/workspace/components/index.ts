// 기본 노드
export { ImageNode } from './ImageNode'
export { NoteNode } from './NoteNode'
export { TextNode } from './TextNode'
export { ShapeNode } from './ShapeNode'
export { BoardNode } from './BoardNode'
export { LinkCardNode } from './LinkCardNode'
export { ChecklistNode } from './ChecklistNode'

// 도구 노드
export { TransparentBgNode } from './TransparentBgNode'

// UI 컴포넌트
export { AssetLibrary } from './AssetLibrary'
export type { Asset, AssetCategory } from './AssetLibrary'
export { CanvasContextMenu, AssetContextMenu, ImagePopup, parsePromptByCategory } from './ContextMenus'
export type { ContextMenu } from './ContextMenus'

// 노드 타입 맵
import { ImageNode } from './ImageNode'
import { NoteNode } from './NoteNode'
import { TextNode } from './TextNode'
import { ShapeNode } from './ShapeNode'
import { BoardNode } from './BoardNode'
import { LinkCardNode } from './LinkCardNode'
import { ChecklistNode } from './ChecklistNode'
import { TransparentBgNode } from './TransparentBgNode'

export const nodeTypes = {
  image: ImageNode,
  note: NoteNode,
  text: TextNode,
  shape: ShapeNode,
  board: BoardNode,
  linkCard: LinkCardNode,
  checklist: ChecklistNode,
  transparentBg: TransparentBgNode,
}
