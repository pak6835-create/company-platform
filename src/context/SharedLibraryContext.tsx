import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 어셋 타입
export interface SharedAsset {
  id: string
  url: string
  prompt?: string
  timestamp: number
  category?: string
  source?: 'whiteboard' | 'storyai'
}

// 컨텍스트 타입
interface SharedLibraryContextType {
  assets: SharedAsset[]
  addAsset: (asset: Omit<SharedAsset, 'id' | 'timestamp'>) => void
  removeAsset: (id: string) => void
  clearAssets: () => void
}

const SharedLibraryContext = createContext<SharedLibraryContextType | null>(null)

const STORAGE_KEY = 'shared_library_assets'

// 로컬스토리지에서 로드
const loadAssets = (): SharedAsset[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load shared library:', e)
  }
  return []
}

// 로컬스토리지에 저장
const saveAssets = (assets: SharedAsset[]) => {
  try {
    // base64 이미지 필터링 (너무 큰 것 제외)
    const filteredAssets = assets.map((asset) => ({
      ...asset,
      url: asset.url.length > 100000 ? '' : asset.url, // 100KB 이상 제외
    })).filter((asset) => asset.url)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAssets.slice(0, 100))) // 최대 100개
  } catch (e) {
    console.error('Failed to save shared library:', e)
  }
}

export function SharedLibraryProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<SharedAsset[]>([])

  // 초기 로드
  useEffect(() => {
    setAssets(loadAssets())
  }, [])

  // 어셋 추가
  const addAsset = (asset: Omit<SharedAsset, 'id' | 'timestamp'>) => {
    const newAsset: SharedAsset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    setAssets((prev) => {
      const updated = [newAsset, ...prev]
      saveAssets(updated)
      return updated
    })
  }

  // 어셋 삭제
  const removeAsset = (id: string) => {
    setAssets((prev) => {
      const updated = prev.filter((a) => a.id !== id)
      saveAssets(updated)
      return updated
    })
  }

  // 전체 삭제
  const clearAssets = () => {
    setAssets([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // asset-add 이벤트 리스너 (화이트보드에서 발생)
  useEffect(() => {
    const handleAssetAdd = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.url) {
        addAsset({
          url: detail.url,
          prompt: detail.prompt,
          category: detail.category || 'default',
          source: 'whiteboard',
        })
      }
    }

    window.addEventListener('asset-add', handleAssetAdd)
    return () => window.removeEventListener('asset-add', handleAssetAdd)
  }, [])

  return (
    <SharedLibraryContext.Provider value={{ assets, addAsset, removeAsset, clearAssets }}>
      {children}
    </SharedLibraryContext.Provider>
  )
}

// 훅
export function useSharedLibrary() {
  const context = useContext(SharedLibraryContext)
  if (!context) {
    throw new Error('useSharedLibrary must be used within SharedLibraryProvider')
  }
  return context
}
