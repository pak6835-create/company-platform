import { useState, useEffect, useRef, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, MODELS, extractAlpha, loadImageData, imageDataToUrl, AspectRatio, ImageSize } from '../utils/geminiApi'

/**
 * 편집 노드 (캐릭터메이커 스타일 UI)
 *
 * 기능:
 * - 왼쪽 카테고리 목록 + 중앙 설정 패널 레이아웃
 * - 각 편집 카테고리별 옵션 버튼 클릭 방식
 * - 선택된 옵션들이 프롬프트로 자동 조합
 */

interface EditNodeData {
  apiKey?: string
}

// 편집 카테고리 정의
const EDIT_CATEGORIES = [
  { id: 'weather', name: '날씨', icon: '🌤️' },
  { id: 'time', name: '시간', icon: '🌙' },
  { id: 'expression', name: '표정', icon: '😊' },
  { id: 'hair', name: '헤어', icon: '💇' },
  { id: 'clothes', name: '옷', icon: '👕' },
  { id: 'accessory', name: '액세서리', icon: '💍' },
  { id: 'weapon', name: '무기', icon: '⚔️' },
  { id: 'background', name: '배경', icon: '🏞️' },
  { id: 'lighting', name: '조명', icon: '💡' },
  { id: 'style', name: '스타일', icon: '🎨' },
  { id: 'pose', name: '포즈', icon: '🕺' },
  { id: 'settings', name: '설정', icon: '⚙️' },
]

// 카테고리별 옵션 데이터
const CATEGORY_OPTIONS: Record<string, { id: string; label: string; prompt: string }[]> = {
  weather: [
    { id: 'sunny', label: '맑음', prompt: 'sunny clear sky' },
    { id: 'cloudy', label: '흐림', prompt: 'cloudy overcast' },
    { id: 'rain', label: '비', prompt: 'raining, rain drops' },
    { id: 'snow', label: '눈', prompt: 'snowing, snow falling' },
    { id: 'fog', label: '안개', prompt: 'foggy, misty atmosphere' },
    { id: 'storm', label: '폭풍', prompt: 'stormy, thunder, lightning' },
    { id: 'sunset', label: '노을', prompt: 'sunset colors in sky' },
  ],
  time: [
    { id: 'dawn', label: '새벽', prompt: 'dawn, early morning light' },
    { id: 'morning', label: '아침', prompt: 'morning sunlight' },
    { id: 'noon', label: '정오', prompt: 'bright noon sunlight' },
    { id: 'afternoon', label: '오후', prompt: 'warm afternoon light' },
    { id: 'dusk', label: '일몰', prompt: 'dusk, sunset lighting' },
    { id: 'night', label: '밤', prompt: 'night time, moonlight' },
    { id: 'midnight', label: '심야', prompt: 'midnight, dark night' },
  ],
  expression: [
    { id: 'happy', label: '행복', prompt: 'happy smiling expression' },
    { id: 'sad', label: '슬픔', prompt: 'sad melancholic expression' },
    { id: 'angry', label: '화남', prompt: 'angry fierce expression' },
    { id: 'surprised', label: '놀람', prompt: 'surprised shocked expression' },
    { id: 'fear', label: '공포', prompt: 'scared fearful expression' },
    { id: 'serious', label: '진지', prompt: 'serious stern expression' },
    { id: 'shy', label: '수줍음', prompt: 'shy blushing expression' },
    { id: 'confident', label: '자신감', prompt: 'confident proud expression' },
  ],
  hair: [
    { id: 'short', label: '짧은머리', prompt: 'short hair' },
    { id: 'medium', label: '중간머리', prompt: 'medium length hair' },
    { id: 'long', label: '긴머리', prompt: 'long flowing hair' },
    { id: 'ponytail', label: '포니테일', prompt: 'ponytail hairstyle' },
    { id: 'twintail', label: '트윈테일', prompt: 'twin tails pigtails' },
    { id: 'braid', label: '땋은머리', prompt: 'braided hair' },
    { id: 'black', label: '검정색', prompt: 'black hair color' },
    { id: 'brown', label: '갈색', prompt: 'brown hair color' },
    { id: 'blonde', label: '금발', prompt: 'blonde golden hair' },
    { id: 'red', label: '빨강', prompt: 'red crimson hair' },
    { id: 'blue', label: '파랑', prompt: 'blue hair color' },
    { id: 'pink', label: '분홍', prompt: 'pink hair color' },
    { id: 'white', label: '흰색', prompt: 'white silver hair' },
  ],
  clothes: [
    { id: 'casual', label: '캐주얼', prompt: 'casual everyday clothes' },
    { id: 'formal', label: '정장', prompt: 'formal suit business attire' },
    { id: 'uniform', label: '교복', prompt: 'school uniform' },
    { id: 'sportswear', label: '운동복', prompt: 'sportswear athletic clothes' },
    { id: 'dress', label: '드레스', prompt: 'elegant dress' },
    { id: 'hoodie', label: '후드티', prompt: 'hoodie casual wear' },
    { id: 'armor', label: '갑옷', prompt: 'knight armor plate mail' },
    { id: 'robe', label: '로브', prompt: 'wizard robe magical attire' },
    { id: 'traditional', label: '전통의상', prompt: 'traditional hanbok kimono' },
    { id: 'swimsuit', label: '수영복', prompt: 'swimsuit beachwear' },
  ],
  accessory: [
    { id: 'glasses', label: '안경', prompt: 'wearing glasses' },
    { id: 'sunglasses', label: '선글라스', prompt: 'wearing sunglasses' },
    { id: 'hat', label: '모자', prompt: 'wearing hat cap' },
    { id: 'crown', label: '왕관', prompt: 'wearing royal crown' },
    { id: 'earring', label: '귀걸이', prompt: 'wearing earrings' },
    { id: 'necklace', label: '목걸이', prompt: 'wearing necklace pendant' },
    { id: 'scarf', label: '스카프', prompt: 'wearing scarf' },
    { id: 'headband', label: '머리띠', prompt: 'wearing headband' },
    { id: 'ribbon', label: '리본', prompt: 'hair ribbon bow' },
    { id: 'mask', label: '마스크', prompt: 'wearing face mask' },
  ],
  weapon: [
    { id: 'none', label: '없음', prompt: '' },
    { id: 'sword', label: '검', prompt: 'holding sword' },
    { id: 'katana', label: '카타나', prompt: 'holding katana japanese sword' },
    { id: 'greatsword', label: '대검', prompt: 'holding greatsword claymore' },
    { id: 'dagger', label: '단검', prompt: 'holding dagger knife' },
    { id: 'spear', label: '창', prompt: 'holding spear lance' },
    { id: 'bow', label: '활', prompt: 'holding bow and arrow' },
    { id: 'staff', label: '지팡이', prompt: 'holding magic staff' },
    { id: 'wand', label: '마법봉', prompt: 'holding magic wand' },
    { id: 'gun', label: '총', prompt: 'holding gun pistol' },
    { id: 'shield', label: '방패', prompt: 'holding shield' },
    { id: 'axe', label: '도끼', prompt: 'holding battle axe' },
  ],
  background: [
    { id: 'white', label: '흰색', prompt: 'solid white background' },
    { id: 'black', label: '검정', prompt: 'solid black background' },
    { id: 'gradient', label: '그라데이션', prompt: 'gradient color background' },
    { id: 'nature', label: '자연', prompt: 'nature forest trees background' },
    { id: 'city', label: '도시', prompt: 'city urban background buildings' },
    { id: 'room', label: '실내', prompt: 'indoor room background' },
    { id: 'sky', label: '하늘', prompt: 'sky clouds background' },
    { id: 'ocean', label: '바다', prompt: 'ocean sea beach background' },
    { id: 'space', label: '우주', prompt: 'space stars galaxy background' },
    { id: 'fantasy', label: '판타지', prompt: 'fantasy magical background' },
  ],
  lighting: [
    { id: 'natural', label: '자연광', prompt: 'natural daylight' },
    { id: 'studio', label: '스튜디오', prompt: 'studio lighting' },
    { id: 'dramatic', label: '드라마틱', prompt: 'dramatic lighting contrast' },
    { id: 'backlight', label: '역광', prompt: 'backlight rim lighting' },
    { id: 'neon', label: '네온', prompt: 'neon colorful lighting' },
    { id: 'candle', label: '촛불', prompt: 'candlelight warm glow' },
    { id: 'moonlight', label: '달빛', prompt: 'moonlight soft blue' },
    { id: 'golden', label: '황금빛', prompt: 'golden hour warm lighting' },
  ],
  style: [
    { id: 'anime', label: '애니메이션', prompt: 'anime animation style' },
    { id: 'webtoon', label: '웹툰', prompt: 'webtoon manhwa style' },
    { id: 'realistic', label: '사실적', prompt: 'realistic detailed style' },
    { id: 'watercolor', label: '수채화', prompt: 'watercolor painting style' },
    { id: 'oil', label: '유화', prompt: 'oil painting style' },
    { id: 'pixel', label: '픽셀아트', prompt: 'pixel art retro style' },
    { id: '3d', label: '3D렌더', prompt: '3D rendered style' },
    { id: 'sketch', label: '스케치', prompt: 'pencil sketch style' },
    { id: 'chibi', label: '치비', prompt: 'chibi cute style' },
  ],
  pose: [
    { id: 'standing', label: '서있기', prompt: 'standing pose' },
    { id: 'sitting', label: '앉기', prompt: 'sitting pose' },
    { id: 'walking', label: '걷기', prompt: 'walking pose' },
    { id: 'running', label: '달리기', prompt: 'running action pose' },
    { id: 'jumping', label: '점프', prompt: 'jumping pose' },
    { id: 'fighting', label: '전투', prompt: 'fighting action pose' },
    { id: 'relaxed', label: '편안함', prompt: 'relaxed casual pose' },
    { id: 'confident', label: '자신감', prompt: 'confident powerful pose' },
    { id: 'shy', label: '수줍음', prompt: 'shy timid pose' },
  ],
}

// 해상도 옵션
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K' },
  { id: '2K', name: '2K' },
  { id: '4K', name: '4K' },
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

  // 선택된 카테고리
  const [selectedCategory, setSelectedCategory] = useState('weather')

  // 각 카테고리별 선택된 옵션들
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

  // 각 카테고리별 참조 이미지 (최대 14개 지원, 카테고리당 최대 2개)
  const [categoryRefImages, setCategoryRefImages] = useState<Record<string, string[]>>({})

  // 커스텀 프롬프트
  const [customPrompt, setCustomPrompt] = useState('')

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 옵션 상태
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState<ImageSize>('2K')

  // 실제 사용할 이미지
  const sourceImage = uploadedImage || connectedImage

  // 선택된 전체 옵션 수 계산
  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedOptions).reduce((sum, opts) => sum + opts.length, 0)
  }, [selectedOptions])

  // 전체 참조 이미지 수 계산 (최대 14개)
  const totalRefImageCount = useMemo(() => {
    return Object.values(categoryRefImages).reduce((sum, imgs) => sum + imgs.length, 0)
  }, [categoryRefImages])

  // 참조 이미지 추가 핸들러
  const addCategoryRefImage = (category: string, imageUrl: string) => {
    setCategoryRefImages(prev => {
      const currentImages = prev[category] || []
      // 카테고리당 최대 2개
      if (currentImages.length >= 2) {
        return prev
      }
      // 전체 최대 14개
      const totalCount = Object.values(prev).reduce((sum, imgs) => sum + imgs.length, 0)
      if (totalCount >= 14) {
        return prev
      }
      return { ...prev, [category]: [...currentImages, imageUrl] }
    })
  }

  // 참조 이미지 삭제 핸들러
  const removeCategoryRefImage = (category: string, index: number) => {
    setCategoryRefImages(prev => {
      const currentImages = prev[category] || []
      return { ...prev, [category]: currentImages.filter((_, i) => i !== index) }
    })
  }

  // 선택된 옵션들의 프롬프트 미리보기 생성
  const previewPrompt = useMemo(() => {
    const promptParts: string[] = []

    // 각 카테고리별 선택된 옵션 표시
    Object.entries(selectedOptions).forEach(([category, optIds]) => {
      if (optIds.length === 0) return
      const categoryOpts = CATEGORY_OPTIONS[category] || []
      const categoryInfo = EDIT_CATEGORIES.find(c => c.id === category)
      const refImgCount = categoryRefImages[category]?.length || 0

      optIds.forEach(optId => {
        const opt = categoryOpts.find(o => o.id === optId)
        if (opt && opt.prompt) {
          const refText = refImgCount > 0 ? ` [참조 ${refImgCount}장]` : ''
          promptParts.push(`${categoryInfo?.icon || ''} ${opt.label}: ${opt.prompt}${refText}`)
        }
      })
    })

    // 참조 이미지만 있는 카테고리 표시
    Object.entries(categoryRefImages).forEach(([category, imgs]) => {
      if (imgs.length === 0) return
      const hasOptions = (selectedOptions[category]?.length || 0) > 0
      if (!hasOptions) {
        const categoryInfo = EDIT_CATEGORIES.find(c => c.id === category)
        promptParts.push(`${categoryInfo?.icon || ''} ${categoryInfo?.name || category}: [참조 이미지 ${imgs.length}장]`)
      }
    })

    // 커스텀 프롬프트 추가
    if (customPrompt.trim()) {
      promptParts.push(`✏️ 커스텀: ${customPrompt.trim()}`)
    }

    return promptParts
  }, [selectedOptions, customPrompt, categoryRefImages])

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
  const handleDrop = (e: React.DragEvent) => {
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
          handleImageUpload(event.target?.result as string)
        }
        reader.readAsDataURL(file)
        return
      }
    }

    if (imageUrl) {
      handleImageUpload(imageUrl)
    }
  }

  // 옵션 토글
  const toggleOption = (category: string, optionId: string) => {
    setSelectedOptions(prev => {
      const currentOpts = prev[category] || []
      if (currentOpts.includes(optionId)) {
        return { ...prev, [category]: currentOpts.filter(o => o !== optionId) }
      } else {
        return { ...prev, [category]: [...currentOpts, optionId] }
      }
    })
  }

  // 프롬프트 생성
  const buildFullPrompt = (): string => {
    const bgInstruction = generateTransparent
      ? 'Use a pure solid white background (#FFFFFF).'
      : ''

    const promptParts: string[] = []

    // 선택된 옵션들의 프롬프트 수집
    Object.entries(selectedOptions).forEach(([category, optIds]) => {
      const categoryOpts = CATEGORY_OPTIONS[category] || []
      optIds.forEach(optId => {
        const opt = categoryOpts.find(o => o.id === optId)
        if (opt && opt.prompt) {
          promptParts.push(opt.prompt)
        }
      })
    })

    // 커스텀 프롬프트 추가
    if (customPrompt.trim()) {
      promptParts.push(customPrompt.trim())
    }

    if (promptParts.length === 0) {
      return bgInstruction
    }

    return `Keep the original character's identity. Apply these changes: ${promptParts.join(', ')}. ${bgInstruction}`
  }

  // 모든 카테고리의 참조 이미지 수집 (base64 배열로 변환)
  const collectAllRefImages = (): string[] => {
    const allRefImages: string[] = []
    Object.values(categoryRefImages).forEach(imgs => {
      imgs.forEach(img => {
        // data:image/png;base64, 부분 제거
        const base64 = img.includes(',') ? img.split(',')[1] : img
        if (base64) {
          allRefImages.push(base64)
        }
      })
    })
    return allRefImages.slice(0, 14) // 최대 14개
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
    if (totalSelectedCount === 0 && !customPrompt.trim() && totalRefImageCount === 0) {
      setStatusText('⚠️ 편집 옵션을 선택하거나 커스텀 프롬프트를 입력하세요')
      return
    }

    setIsProcessing(true)
    setResultImage(null)
    setProgress(0)
    setStatusText('✏️ 편집 준비 중...')

    try {
      const sourceBase64 = sourceImage.split(',')[1]
      const model = MODELS[0].id
      const prompt = buildFullPrompt()

      // 참조 이미지 수집
      const refImages = collectAllRefImages()
      const hasRefImages = refImages.length > 0

      setProgress(10)
      setStatusText(hasRefImages ? `🔄 이미지 분석 중... (참조 ${refImages.length}장)` : '🔄 이미지 분석 중...')

      const result = await editImage(
        apiKey,
        sourceBase64,
        prompt,
        model,
        'image/png',
        hasRefImages ? refImages : undefined,
        { imageSize: resolution }
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
          { imageSize: resolution }
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
        prompt: `편집: ${Object.keys(selectedOptions).filter(k => selectedOptions[k]?.length > 0).join(', ')}`,
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

  // 설정 패널 렌더링
  const renderSettingsPanel = () => {
    const cat = selectedCategory

    // 설정 카테고리
    if (cat === 'settings') {
      return (
        <div className="edit-settings-panel" style={{ padding: 8 }}>
          <h4 style={{ fontSize: 13, margin: '0 0 12px 0', color: '#f59e0b' }}>⚙️ API 설정</h4>

          {/* API 키 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              API 키
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Google AI API 키 입력..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #444',
                  background: '#1a1a2e',
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

          {/* 투명 배경 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={generateTransparent}
                onChange={(e) => setGenerateTransparent(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span>🎭 투명 배경으로 생성</span>
            </label>
            <p style={{ fontSize: 10, color: '#888', margin: '4px 0 0 24px' }}>
              {generateTransparent ? 'API 2회 호출' : 'API 1회 호출'}
            </p>
          </div>

          {/* 해상도 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>📐 해상도</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RESOLUTION_OPTIONS.map(res => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id as ImageSize)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: resolution === res.id ? '#f59e0b' : '#3f3f46',
                    color: resolution === res.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: resolution === res.id ? 'bold' : 'normal',
                  }}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>

          {/* 초기화 버튼 */}
          <button
            onClick={() => setSelectedOptions({})}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              border: 'none',
              background: '#3f3f46',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            🔄 선택 초기화
          </button>

          {/* API 도움말 */}
          <div style={{ marginTop: 12, padding: 8, background: '#1a1a2e', borderRadius: 6 }}>
            <p style={{ fontSize: 10, color: '#888', margin: 0 }}>
              💡 Google AI Studio에서 API 키를 발급받으세요
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: '#f59e0b' }}
            >
              API 키 발급하기 →
            </a>
          </div>
        </div>
      )
    }

    // 일반 카테고리 옵션들
    const options = CATEGORY_OPTIONS[cat] || []
    const selected = selectedOptions[cat] || []
    const catRefImages = categoryRefImages[cat] || []
    const canAddMoreRefImages = catRefImages.length < 2 && totalRefImageCount < 14

    return (
      <div className="edit-options-panel" style={{ padding: 8 }}>
        <h4 style={{ fontSize: 13, margin: '0 0 12px 0', color: '#f59e0b' }}>
          {EDIT_CATEGORIES.find(c => c.id === cat)?.icon} {EDIT_CATEGORIES.find(c => c.id === cat)?.name}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => toggleOption(cat, opt.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: selected.includes(opt.id) ? '2px solid #f59e0b' : '1px solid #555',
                background: selected.includes(opt.id) ? 'rgba(245, 158, 11, 0.2)' : '#2a2a3e',
                color: selected.includes(opt.id) ? '#f59e0b' : '#ccc',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: selected.includes(opt.id) ? 'bold' : 'normal',
              }}
            >
              {selected.includes(opt.id) && '✓ '}
              {opt.label}
            </button>
          ))}
        </div>

        {/* 참조 이미지 (카테고리별) */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📷 참조 이미지 (선택)</span>
            <span style={{ fontSize: 10, color: '#666' }}>
              {catRefImages.length}/2개 | 전체 {totalRefImageCount}/14개
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* 기존 참조 이미지들 */}
            {catRefImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 6,
                  border: '1px solid #555',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={img}
                  alt={`ref-${idx}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={() => removeCategoryRefImage(cat, idx)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 이미지 추가 버튼 */}
            {canAddMoreRefImages && (
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
                        addCategoryRefImage(cat, ev.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      addCategoryRefImage(cat, ev.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 6,
                  border: '2px dashed #555',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: 10,
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>+</span>
                <span>추가</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 9, color: '#666', margin: '6px 0 0 0' }}>
            이 카테고리의 스타일/특성을 참조할 이미지
          </p>
        </div>

        {/* 커스텀 프롬프트 */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
            ✏️ 추가 설명 (선택)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="추가로 변경하고 싶은 내용을 입력하세요..."
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              border: '1px solid #555',
              background: '#1a1a2e',
              color: 'white',
              fontSize: 11,
              resize: 'none',
              minHeight: 60,
            }}
          />
        </div>

        {/* 선택된 프롬프트 미리보기 */}
        {previewPrompt.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#10b981', marginBottom: 6, fontWeight: 'bold' }}>
              📋 적용될 프롬프트 ({previewPrompt.length}개)
            </div>
            <div
              style={{
                background: '#1a1a2e',
                borderRadius: 6,
                padding: 10,
                border: '1px solid #333',
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {previewPrompt.map((prompt, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 10,
                    color: '#ccc',
                    padding: '4px 0',
                    borderBottom: idx < previewPrompt.length - 1 ? '1px solid #333' : 'none',
                  }}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        )}
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
        minHeight: 600,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={700} minHeight={600} />

      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '10px 16px',
          fontWeight: 'bold',
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span>✏️ 이미지 편집</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {totalSelectedCount}개 선택
        </span>
      </div>

      {/* 메인 레이아웃 */}
      <div
        className="nodrag"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 왼쪽: 카테고리 목록 */}
        <div
          style={{
            width: 80,
            background: '#252538',
            borderRight: '1px solid #333',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          {EDIT_CATEGORIES.map((cat) => {
            const hasSelection = (selectedOptions[cat.id]?.length || 0) > 0
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  width: '100%',
                  padding: '10px 6px',
                  border: 'none',
                  borderLeft: selectedCategory === cat.id ? '3px solid #f59e0b' : '3px solid transparent',
                  background: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: selectedCategory === cat.id ? '#f59e0b' : hasSelection ? '#10b981' : '#888',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span>{cat.name}</span>
                {hasSelection && (
                  <span style={{ fontSize: 8, color: '#10b981' }}>●</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 중앙: 설정 패널 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 8,
            minWidth: 200,
          }}
        >
          {renderSettingsPanel()}
        </div>

        {/* 오른쪽: 이미지 영역 */}
        <div
          style={{
            width: 280,
            background: '#252538',
            borderLeft: '1px solid #333',
            padding: 12,
            overflowY: 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* 원본 이미지 */}
          <div>
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
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              style={{
                border: `2px dashed ${sourceImage ? '#10b981' : '#f59e0b'}`,
                borderRadius: 6,
                padding: 8,
                textAlign: 'center',
                cursor: 'pointer',
                background: sourceImage ? 'transparent' : '#1a1a2e',
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sourceImage ? (
                <img
                  src={sourceImage}
                  alt="source"
                  style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4, objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: 11, color: '#888' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                  클릭/드롭하여 업로드
                </div>
              )}
            </div>
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={handleProcess}
            disabled={isProcessing || !apiKey || !sourceImage || (totalSelectedCount === 0 && !customPrompt.trim())}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 6,
              border: 'none',
              background: isProcessing
                ? '#555'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              fontWeight: 'bold',
              cursor: isProcessing ? 'wait' : 'pointer',
              fontSize: 12,
            }}
          >
            {isProcessing ? '⏳ 처리 중...' : '✏️ 편집 실행'}
          </button>

          {/* 프로그레스 */}
          {isProcessing && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginBottom: 4 }}>
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
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
              background: statusText.includes('✅') ? '#1a3d1a' : statusText.includes('❌') || statusText.includes('⚠️') ? '#3d1a1a' : '#2a2a3e',
              borderRadius: 4,
              fontSize: 10,
              textAlign: 'center',
            }}>
              {statusText}
            </div>
          )}

          {/* 결과 이미지 */}
          {resultImage && (
            <div>
              <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, fontWeight: 'bold' }}>✨ 결과</div>
              <div style={{
                background: generateTransparent
                  ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                  : '#1a1a2e',
                borderRadius: 6,
                padding: 4,
              }}>
                <img
                  src={resultImage}
                  alt="Result"
                  style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4, display: 'block' }}
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
                  background: '#10b981',
                  color: '#fff',
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
