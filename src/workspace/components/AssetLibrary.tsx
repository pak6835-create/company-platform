import { useState, useCallback } from 'react'

// 어셋 타입
export interface Asset {
  id: string
  url: string
  prompt: string
  timestamp: number
  category: string
}

// 어셋 카테고리 타입
export interface AssetCategory {
  id: string
  name: string
  color: string
}

interface AssetLibraryProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  categories: AssetCategory[]
  setCategories: React.Dispatch<React.SetStateAction<AssetCategory[]>>
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  showAssetLibrary: boolean
  setShowAssetLibrary: (show: boolean) => void
  libraryWidth: number
  setLibraryWidth: (width: number) => void
  onImagePopup: (url: string, prompt?: string) => void
  onAssetContextMenu: (e: React.MouseEvent, asset: Asset) => void
}

export function AssetLibrary({
  assets,
  setAssets,
  categories,
  setCategories,
  selectedCategory,
  setSelectedCategory,
  showAssetLibrary,
  setShowAssetLibrary,
  libraryWidth,
  setLibraryWidth,
  onImagePopup,
  onAssetContextMenu,
}: AssetLibraryProps) {
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // 파일 업로드 처리
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const allImageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const imageFiles = allImageFiles.slice(0, 10)

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
  }, [selectedCategory, setAssets])

  // 필터링된 어셋
  const filteredAssets = selectedCategory === 'default'
    ? assets
    : assets.filter(a => a.category === selectedCategory)

  return (
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
              handleFileUpload(e.dataTransfer.files)
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.multiple = true
              input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files)
              input.click()
            }}
          >
            <span>📁 이미지 업로드</span>
            <span className="upload-hint">클릭 또는 드래그 (다중 선택 가능)</span>
          </div>

          {/* 필터링된 어셋 목록 */}
          {filteredAssets.length === 0 ? (
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
                  onDoubleClick={() => onImagePopup(asset.url, asset.prompt)}
                  onDragStart={(e) => {
                    const data = JSON.stringify({
                      type: 'asset',
                      url: asset.url,
                      prompt: asset.prompt
                    })
                    e.dataTransfer.setData('application/json', data)
                    e.dataTransfer.setData('text/plain', data)
                    e.dataTransfer.effectAllowed = 'copyMove'
                    const img = e.currentTarget.querySelector('img')
                    if (img) {
                      e.dataTransfer.setDragImage(img, 50, 50)
                    }
                  }}
                  onContextMenu={(e) => onAssetContextMenu(e, asset)}
                >
                  <img src={asset.url} alt="asset" draggable={false} />
                  <div className="asset-sidebar-actions">
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
          )}

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
  )
}
