import { useState, useEffect, useRef, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, MODELS, extractAlpha, loadImageData, imageDataToUrl, AspectRatio, ImageSize } from '../utils/geminiApi'

/**
 * 편집 노드 (다중 편집 지원)
 *
 * 기능:
 * - 여러 편집 유형 중복 선택 가능
 * - 각 편집 항목별 강도 조절 (0-100%)
 * - 각 편집 항목별 참조 이미지 첨부
 * - 색상값 입력 지원
 * - 캐릭터메이커 스타일 프롬프트 추가 방식
 */

interface EditNodeData {
  apiKey?: string
}

// 편집 항목 인터페이스
interface EditItem {
  id: string
  type: string
  prompt: string
  strength: number // 0-100
  color?: string
  refImage?: string
}

// 편집 유형 정의
const EDIT_TYPE_OPTIONS = [
  { id: 'pose', name: '포즈', icon: '🕺', placeholder: '참조 이미지의 포즈로 변경' },
  { id: 'weather', name: '날씨', icon: '🌤️', placeholder: '맑음, 비, 눈, 안개...' },
  { id: 'time', name: '시간', icon: '🌙', placeholder: '새벽, 아침, 정오, 일몰, 밤...' },
  { id: 'clothes', name: '옷', icon: '👕', placeholder: '검은 정장, 캐주얼 청바지...' },
  { id: 'weapon', name: '무기', icon: '⚔️', placeholder: '빛나는 장검, 마법 지팡이...' },
  { id: 'expression', name: '표정', icon: '😊', placeholder: '행복, 슬픔, 화남, 놀람...' },
  { id: 'hair', name: '헤어', icon: '💇', placeholder: '금발 롱헤어, 검은 단발...' },
  { id: 'background', name: '배경', icon: '🏞️', placeholder: '숲속, 도시, 바다, 우주...' },
  { id: 'lighting', name: '조명', icon: '💡', placeholder: '역광, 부드러운 조명, 네온...' },
  { id: 'style', name: '스타일', icon: '🎨', placeholder: '애니메이션, 수채화, 유화...' },
  { id: 'accessory', name: '액세서리', icon: '💍', placeholder: '안경, 목걸이, 모자...' },
  { id: 'custom', name: '커스텀', icon: '✏️', placeholder: '자유롭게 편집 내용 입력...' },
]

// 빠른 선택 프리셋
const QUICK_PRESETS: Record<string, string[]> = {
  weather: ['맑음', '흐림', '비', '눈', '안개', '폭풍'],
  time: ['새벽', '아침', '정오', '오후', '일몰', '밤'],
  expression: ['행복', '슬픔', '화남', '놀람', '공포', '진지'],
  lighting: ['자연광', '역광', '네온', '촛불', '스튜디오', '드라마틱'],
  style: ['애니메이션', '수채화', '유화', '픽셀아트', '3D렌더', '만화'],
}

// 해상도 옵션
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K' },
  { id: '2K', name: '2K' },
  { id: '4K', name: '4K' },
]

// 종횡비 옵션
const ASPECT_RATIO_OPTIONS = [
  { id: '16:9', name: '16:9' },
  { id: '1:1', name: '1:1' },
  { id: '9:16', name: '9:16' },
]

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number; category?: string }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function EditNode({ data, selected, id }: NodeProps<EditNodeData>) {
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const edges = useStore((state) => state.edges) || []

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)

  // 이미지 상태
  const [connectedImage, setConnectedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // 편집 항목 목록
  const [editItems, setEditItems] = useState<EditItem[]>([])
  const [showAddMenu, setShowAddMenu] = useState(false)

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 옵션 상태
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState<ImageSize>('2K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // 실제 사용할 이미지
  const sourceImage = uploadedImage || connectedImage

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 이미지 노드 추적
  const connectedEdgeId = useMemo(() => {
    if (!Array.isArray(edges)) return null
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'image-in')
    return edge?.source || null
  }, [edges, id])

  // 연결된 노드에서 이미지 가져오기
  useEffect(() => {
    if (!connectedEdgeId) {
      setConnectedImage(null)
      return
    }

    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === connectedEdgeId)
    if (sourceNode) {
      const imageUrl = sourceNode.data?.imageUrl ||
                      sourceNode.data?.url ||
                      sourceNode.data?.resultImage ||
                      sourceNode.data?.generatedImage
      if (imageUrl) {
        setConnectedImage(imageUrl)
        setUploadedImage(null)
      }
    }
  }, [connectedEdgeId, getNodes])

  // 이미지 업로드 핸들러
  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl)
    setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'image-in')))
    setConnectedImage(null)
    setResultImage(null)
    setStatusText('')
  }

  // 드래그 앤 드롭 처리
  const handleDrop = (e: React.DragEvent, target: 'source' | 'item', itemId?: string) => {
    e.preventDefault()
    e.stopPropagation()

    const jsonData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    let imageUrl: string | null = null

    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData)
        if (parsed.type === 'asset' && parsed.url) {
          imageUrl = parsed.url
        }
      } catch (err) {
        // 파싱 실패
      }
    }

    if (!imageUrl) {
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          if (target === 'source') {
            handleImageUpload(dataUrl)
          } else if (itemId) {
            updateEditItem(itemId, { refImage: dataUrl })
          }
        }
        reader.readAsDataURL(file)
        return
      }
    }

    if (imageUrl) {
      if (target === 'source') {
        handleImageUpload(imageUrl)
      } else if (itemId) {
        updateEditItem(itemId, { refImage: imageUrl })
      }
    }
  }

  // 편집 항목 추가
  const addEditItem = (type: string) => {
    const typeInfo = EDIT_TYPE_OPTIONS.find(t => t.id === type)
    const newItem: EditItem = {
      id: `${type}-${Date.now()}`,
      type,
      prompt: '',
      strength: 80,
      color: '',
      refImage: undefined,
    }
    setEditItems([...editItems, newItem])
    setShowAddMenu(false)
  }

  // 편집 항목 업데이트
  const updateEditItem = (itemId: string, updates: Partial<EditItem>) => {
    setEditItems(items => items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }

  // 편집 항목 삭제
  const removeEditItem = (itemId: string) => {
    setEditItems(items => items.filter(item => item.id !== itemId))
  }

  // 프롬프트 생성
  const buildFullPrompt = (): string => {
    const bgInstruction = generateTransparent
      ? 'Use a pure solid white background (#FFFFFF).'
      : ''

    if (editItems.length === 0) {
      return bgInstruction
    }

    const editInstructions = editItems
      .filter(item => item.prompt.trim())
      .map(item => {
        const typeInfo = EDIT_TYPE_OPTIONS.find(t => t.id === item.type)
        const strengthText = item.strength < 50 ? 'subtly' : item.strength > 80 ? 'strongly' : 'moderately'
        const colorText = item.color ? ` with color ${item.color}` : ''

        switch (item.type) {
          case 'pose':
            return `${strengthText} change the pose to: ${item.prompt}${colorText}`
          case 'weather':
            return `${strengthText} change the weather/atmosphere to: ${item.prompt}${colorText}`
          case 'time':
            return `${strengthText} change the time of day/lighting to: ${item.prompt}${colorText}`
          case 'clothes':
            return `${strengthText} change the clothing to: ${item.prompt}${colorText}`
          case 'weapon':
            return `${strengthText} add or change weapon/item to: ${item.prompt}${colorText}`
          case 'expression':
            return `${strengthText} change facial expression to: ${item.prompt}${colorText}`
          case 'hair':
            return `${strengthText} change hairstyle to: ${item.prompt}${colorText}`
          case 'background':
            return `${strengthText} change background to: ${item.prompt}${colorText}`
          case 'lighting':
            return `${strengthText} change lighting to: ${item.prompt}${colorText}`
          case 'style':
            return `${strengthText} apply art style: ${item.prompt}${colorText}`
          case 'accessory':
            return `${strengthText} add or change accessory: ${item.prompt}${colorText}`
          case 'custom':
          default:
            return `${strengthText} ${item.prompt}${colorText}`
        }
      })
      .join('. ')

    return `Keep the original character's identity. Apply these edits: ${editInstructions}. ${bgInstruction}`
  }

  // 참조 이미지들 수집
  const getRefImages = (): string[] => {
    return editItems
      .filter(item => item.refImage)
      .map(item => item.refImage!)
  }

  // 편집 실행
  const handleProcess = async () => {
    if (!apiKey) {
      setStatusText('⚠️ API 키를 입력하세요')
      return
    }
    if (!sourceImage) {
      setStatusText('⚠️ 원본 이미지를 업로드하세요')
      return
    }
    if (editItems.length === 0) {
      setStatusText('⚠️ 편집 항목을 추가하세요')
      return
    }
    if (!editItems.some(item => item.prompt.trim())) {
      setStatusText('⚠️ 최소 하나의 편집 내용을 입력하세요')
      return
    }

    setIsProcessing(true)
    setResultImage(null)
    setProgress(0)
    setStatusText('✏️ 편집 준비 중...')

    try {
      const sourceBase64 = sourceImage.split(',')[1]
      const refImages = getRefImages()
      const refBase64 = refImages.length > 0 ? refImages[0].split(',')[1] : undefined
      const model = MODELS[0].id
      const prompt = buildFullPrompt()

      setProgress(10)
      setStatusText('🔄 이미지 분석 중...')

      const result = await editImage(
        apiKey,
        sourceBase64,
        prompt,
        model,
        'image/png',
        refBase64,
        { aspectRatio, imageSize: resolution }
      )

      let finalImage = result.url

      // 투명 배경 처리
      if (generateTransparent) {
        setProgress(50)
        setStatusText('🎭 검정 배경 변환 중...')

        const blackResult = await editImage(
          apiKey,
          result.base64,
          'Change ONLY the background color from white to pure black #000000. Do NOT modify the character at all.',
          model,
          'image/png',
          undefined,
          { aspectRatio, imageSize: resolution }
        )

        setProgress(80)
        setStatusText('✨ 투명 배경 생성 중...')

        const [whiteData, blackData] = await Promise.all([
          loadImageData(result.url),
          loadImageData(blackResult.url),
        ])

        const resultData = extractAlpha(whiteData, blackData)
        finalImage = imageDataToUrl(resultData)
      }

      setProgress(100)
      setResultImage(finalImage)
      setStatusText('✅ 편집 완료!')

      emitAssetAdd({
        url: finalImage,
        prompt: `편집: ${editItems.map(i => i.type).join(', ')}`,
        timestamp: Date.now(),
        category: 'character',
      })
    } catch (err) {
      console.error('편집 오류:', err)
      setStatusText(`❌ ${err instanceof Error ? err.message : '처리 실패'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 편집 항목 UI 렌더링
  const renderEditItem = (item: EditItem, index: number) => {
    const typeInfo = EDIT_TYPE_OPTIONS.find(t => t.id === item.type)
    const presets = QUICK_PRESETS[item.type]

    return (
      <div
        key={item.id}
        style={{
          background: '#2a2a3e',
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          border: '1px solid #444',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{typeInfo?.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#f59e0b' }}>{typeInfo?.name}</span>
          </div>
          <button
            onClick={() => removeEditItem(item.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 프롬프트 입력 */}
        <textarea
          value={item.prompt}
          onChange={(e) => updateEditItem(item.id, { prompt: e.target.value })}
          placeholder={typeInfo?.placeholder}
          style={{
            width: '100%',
            padding: 8,
            borderRadius: 6,
            border: '1px solid #555',
            background: '#1a1a2e',
            color: 'white',
            fontSize: 11,
            resize: 'none',
            minHeight: 50,
            marginBottom: 8,
          }}
        />

        {/* 빠른 프리셋 */}
        {presets && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {presets.map(preset => (
              <button
                key={preset}
                onClick={() => updateEditItem(item.id, { prompt: preset })}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: item.prompt === preset ? '#f59e0b' : '#3f3f46',
                  color: item.prompt === preset ? '#000' : '#ccc',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {/* 강도 슬라이더 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 4 }}>
            <span>강도</span>
            <span>{item.strength}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={item.strength}
            onChange={(e) => updateEditItem(item.id, { strength: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: '#f59e0b' }}
          />
        </div>

        {/* 색상 및 참조 이미지 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 색상 입력 */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 4 }}>
              🎨 색상 (선택)
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="color"
                value={item.color || '#ffffff'}
                onChange={(e) => updateEditItem(item.id, { color: e.target.value })}
                style={{
                  width: 32,
                  height: 28,
                  padding: 0,
                  border: '1px solid #555',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={item.color || ''}
                onChange={(e) => updateEditItem(item.id, { color: e.target.value })}
                placeholder="#RRGGBB"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #555',
                  background: '#1a1a2e',
                  color: 'white',
                  fontSize: 10,
                }}
              />
              {item.color && (
                <button
                  onClick={() => updateEditItem(item.id, { color: '' })}
                  style={{
                    background: '#3f3f46',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '4px 6px',
                    borderRadius: 4,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 참조 이미지 */}
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 4 }}>
              📷 참조
            </label>
            <div
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      updateEditItem(item.id, { refImage: ev.target?.result as string })
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
              onDrop={(e) => handleDrop(e, 'item', item.id)}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              style={{
                width: '100%',
                height: 50,
                border: '1px dashed #555',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {item.refImage ? (
                <>
                  <img
                    src={item.refImage}
                    alt="ref"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateEditItem(item.id, { refImage: undefined })
                    }}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 10,
                      padding: '1px 4px',
                      borderRadius: 2,
                    }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 16, color: '#555' }}>+</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`edit-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#1a1a2e',
        borderRadius: 12,
        border: selected ? '2px solid #f59e0b' : '2px solid #333',
        width: '100%',
        height: '100%',
        minHeight: 700,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={450} minHeight={700} />

      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '12px 16px',
          borderRadius: '10px 10px 0 0',
          fontWeight: 'bold',
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>✏️ 편집</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {editItems.length}개 편집
        </span>
      </div>

      {/* 스크롤 가능한 콘텐츠 */}
      <div
        className="nodrag"
        style={{
          padding: 16,
          height: 'calc(100% - 48px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* API 키 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
            Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키 입력"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: '#444',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* 원본 이미지 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>🖼️ 원본 이미지</span>
            {sourceImage && (
              <button
                onClick={() => {
                  setUploadedImage(null)
                  setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'image-in')))
                  setConnectedImage(null)
                }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 10 }}
              >
                ✕
              </button>
            )}
          </div>
          <div
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => handleImageUpload(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }
              }
              input.click()
            }}
            onDrop={(e) => handleDrop(e, 'source')}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            style={{
              border: `2px dashed ${sourceImage ? '#10b981' : '#f59e0b'}`,
              borderRadius: 6,
              padding: 8,
              textAlign: 'center',
              cursor: 'pointer',
              background: sourceImage ? 'transparent' : '#2a2a3e',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sourceImage ? (
              <img
                src={sourceImage}
                alt="source"
                style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ fontSize: 11, color: '#888' }}>클릭/드롭하여 업로드</div>
            )}
          </div>
        </div>

        {/* 편집 항목 목록 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8, fontWeight: 'bold' }}>
            📝 편집 항목
          </div>

          {editItems.map((item, index) => renderEditItem(item, index))}

          {/* 편집 추가 버튼 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 6,
                border: '2px dashed #555',
                background: 'transparent',
                color: '#888',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              <span>편집 추가</span>
            </button>

            {/* 추가 메뉴 */}
            {showAddMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 4,
                  zIndex: 100,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {EDIT_TYPE_OPTIONS.map(type => (
                    <button
                      key={type.id}
                      onClick={() => addEditItem(type.id)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#3f3f46',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 옵션 패널 */}
        <div style={{
          background: '#2a2a3e',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          border: '1px solid #444',
        }}>
          {/* 투명 배경 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={generateTransparent}
                onChange={(e) => setGenerateTransparent(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              <span>🎭 투명 배경</span>
            </label>
          </div>

          {/* 해상도 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: '#aaa', display: 'block', marginBottom: 4 }}>해상도</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RESOLUTION_OPTIONS.map(res => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id as ImageSize)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: 'none',
                    background: resolution === res.id ? '#f59e0b' : '#3f3f46',
                    color: resolution === res.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>

          {/* 종횡비 */}
          <div>
            <label style={{ fontSize: 10, color: '#aaa', display: 'block', marginBottom: 4 }}>종횡비</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {ASPECT_RATIO_OPTIONS.map(ar => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: 'none',
                    background: aspectRatio === ar.id ? '#f59e0b' : '#3f3f46',
                    color: aspectRatio === ar.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !sourceImage || editItems.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 6,
            border: 'none',
            background: isProcessing
              ? '#555'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing ? 'wait' : 'pointer',
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : '✏️ 편집 실행'}
        </button>

        {/* 프로그레스 */}
        {isProcessing && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginBottom: 4 }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#2a2a3e', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* 상태 메시지 */}
        {!isProcessing && statusText && (
          <div style={{
            padding: '6px 10px',
            background: statusText.includes('✅') ? '#1a3d1a' : statusText.includes('❌') ? '#3d1a1a' : '#2a2a3e',
            borderRadius: 4,
            fontSize: 11,
            marginBottom: 10,
            textAlign: 'center',
          }}>
            {statusText}
          </div>
        )}

        {/* 결과 이미지 */}
        {resultImage && (
          <div>
            <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold' }}>✨ 결과</div>
            <div style={{
              background: generateTransparent
                ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                : '#2a2a3e',
              borderRadius: 6,
              padding: 4,
            }}>
              <img
                src={resultImage}
                alt="Result"
                style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 4, display: 'block' }}
              />
            </div>
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = resultImage
                link.download = `edited-${Date.now()}.png`
                link.click()
              }}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 4,
                border: 'none',
                background: '#f59e0b',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ⬇️ PNG 다운로드
            </button>
          </div>
        )}
      </div>

      {/* 핸들 */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{ top: '50%', background: '#f59e0b', width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#10b981', width: 12, height: 12 }}
      />
    </div>
  )
}
