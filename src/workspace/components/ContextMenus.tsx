import { useCallback } from 'react'
import type { Node } from 'reactflow'
import type { Asset } from './AssetLibrary'

// 컨텍스트 메뉴 타입
export interface ContextMenu {
  x: number
  y: number
  type: 'canvas' | 'node'
  nodeId?: string
  nodeData?: {
    imageUrl?: string
    prompt?: string
  }
}

// 프롬프트를 카테고리별로 파싱하는 함수
export const parsePromptByCategory = (prompt: string) => {
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

  const charMatch = prompt.match(/Character Details:\n([\s\S]*?)(?=\n\nHair:|$)/)
  if (charMatch) categories['캐릭터 상세'] = charMatch[1].trim()

  const hairMatch = prompt.match(/Hair:\s*([^\n]+)/)
  if (hairMatch) categories['머리카락'] = hairMatch[1].trim()

  const outfitMatch = prompt.match(/Outfit:\s*([^\n]+)/)
  if (outfitMatch) categories['의상'] = outfitMatch[1].trim()

  const accMatch = prompt.match(/Accessories:\s*([^\n]+)/)
  if (accMatch) categories['악세서리'] = accMatch[1].trim()

  const weaponMatch = prompt.match(/Weapon:\s*([^\n]+)/)
  if (weaponMatch) categories['무기'] = weaponMatch[1].trim()

  const styleMatch = prompt.match(/Art Style:\s*([^\n]+)/)
  if (styleMatch) categories['아트 스타일'] = styleMatch[1].trim()

  const bgMatch = prompt.match(/Background:\s*([^\n]+)/)
  if (bgMatch) categories['배경'] = bgMatch[1].trim()

  return categories
}

// 캔버스/노드 컨텍스트 메뉴 Props
interface CanvasContextMenuProps {
  contextMenu: ContextMenu
  nodes: Node[]
  onClose: () => void
  onAddToLibrary: () => void
  onCopyPrompt: () => void
  onDelete: () => void
  onAddNode: (nodeType: string) => void
  onAlignVertical: () => void
  onAlignHorizontal: () => void
  onAlignGrid: () => void
}

export function CanvasContextMenu({
  contextMenu,
  nodes,
  onClose,
  onAddToLibrary,
  onCopyPrompt,
  onDelete,
  onAddNode,
  onAlignVertical,
  onAlignHorizontal,
  onAlignGrid,
}: CanvasContextMenuProps) {
  const selectedNodes = nodes.filter(n => n.selected)
  const imageNodes = selectedNodes.filter(n => n.data?.imageUrl)

  return (
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
        <>
          {/* 선택된 이미지 노드가 있으면 라이브러리 추가 메뉴 표시 */}
          {imageNodes.length > 0 && (
            <>
              <div className="context-menu-item" onClick={onAddToLibrary}>
                📚 라이브러리에 추가 ({imageNodes.length}개)
              </div>
              <div className="context-menu-divider" />
            </>
          )}
          {/* 선택된 노드가 있으면 정렬 메뉴 먼저 표시 */}
          {selectedNodes.length >= 2 && (
            <>
              <div className="context-menu-submenu-title">정렬</div>
              <div className="context-menu-item" onClick={() => { onAlignVertical(); onClose(); }}>
                ⬇️ 세로 정렬
              </div>
              <div className="context-menu-item" onClick={() => { onAlignHorizontal(); onClose(); }}>
                ➡️ 가로 정렬
              </div>
              <div className="context-menu-item" onClick={() => { onAlignGrid(); onClose(); }}>
                ⊞ 그리드 정렬
              </div>
              <div className="context-menu-divider" />
            </>
          )}
          <div className="context-menu-submenu-title">노드 추가</div>
          <div className="context-menu-item" onClick={() => onAddNode('transparentBg')}>
            🎭 투명 배경 생성기
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => onAddNode('note')}>
            📝 노트
          </div>
          <div className="context-menu-item" onClick={() => onAddNode('text')}>
            📄 텍스트
          </div>
        </>
      ) : (
        <>
          {/* 다중 선택 시 이미지 노드가 있거나, 단일 노드가 이미지인 경우 */}
          {(imageNodes.length > 0 || contextMenu.nodeData?.imageUrl) && (
            <div className="context-menu-item" onClick={onAddToLibrary}>
              📚 라이브러리에 추가 {imageNodes.length > 1 ? `(${imageNodes.length}개)` : ''}
            </div>
          )}
          {contextMenu.nodeData?.prompt && (
            <div className="context-menu-item" onClick={onCopyPrompt}>
              📋 프롬프트 복사
            </div>
          )}
          {(contextMenu.nodeData?.imageUrl || contextMenu.nodeData?.prompt) && (
            <div className="context-menu-divider" />
          )}
          {/* 정렬 메뉴 */}
          <div className="context-menu-submenu-title">정렬</div>
          <div className="context-menu-item" onClick={() => { onAlignVertical(); onClose(); }}>
            ⬇️ 세로 정렬
          </div>
          <div className="context-menu-item" onClick={() => { onAlignHorizontal(); onClose(); }}>
            ➡️ 가로 정렬
          </div>
          <div className="context-menu-item" onClick={() => { onAlignGrid(); onClose(); }}>
            ⊞ 그리드 정렬
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item context-menu-delete" onClick={onDelete}>
            🗑️ 삭제
          </div>
        </>
      )}
    </div>
  )
}

// 어셋 컨텍스트 메뉴 Props
interface AssetContextMenuProps {
  x: number
  y: number
  asset: Asset
  onClose: () => void
  onDelete: () => void
}

export function AssetContextMenu({
  x,
  y,
  asset,
  onClose,
  onDelete,
}: AssetContextMenuProps) {
  const parsedPrompt = parsePromptByCategory(asset.prompt)

  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
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
      {Object.entries(parsedPrompt).map(([category, content]) => {
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
              onClose()
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
            link.href = asset.url
            link.download = `asset-${asset.timestamp}.png`
            link.click()
            onClose()
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
          onClick={onDelete}
        >
          <span>🗑️</span>
          <span>삭제</span>
        </div>
      </div>
    </div>
  )
}

// 이미지 팝업 Props
interface ImagePopupProps {
  url: string
  prompt?: string
  onClose: () => void
}

export function ImagePopup({ url, prompt, onClose }: ImagePopupProps) {
  return (
    <div className="image-popup-overlay" onClick={onClose}>
      <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-popup-close" onClick={onClose} title="닫기 (ESC)">
          ×
        </button>
        <img src={url} alt="이미지" />
        {prompt && (
          <div className="image-popup-prompt">
            <span>{prompt}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt)
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
              link.href = url
              link.download = `image-${Date.now()}.png`
              link.click()
            }}
          >
            ⬇️ 다운로드
          </button>
        </div>
      </div>
    </div>
  )
}
