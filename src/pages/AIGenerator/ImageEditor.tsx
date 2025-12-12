import { useState, useMemo } from 'react'
import { editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS } from './geminiApi'
import type { ImageSize } from './geminiApi'

interface ImageEditorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void
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
    { id: 'spear', label: '창', prompt: 'holding spear lance' },
    { id: 'bow', label: '활', prompt: 'holding bow and arrow' },
    { id: 'staff', label: '지팡이', prompt: 'holding magic staff' },
    { id: 'gun', label: '총', prompt: 'holding gun pistol' },
    { id: 'shield', label: '방패', prompt: 'holding shield' },
    { id: 'dagger', label: '단검', prompt: 'holding dagger knife' },
    { id: 'wand', label: '마법봉', prompt: 'holding magic wand' },
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

export function ImageEditor({ onImageGenerated }: ImageEditorProps) {
  // 상태
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('weather')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [customPrompt, setCustomPrompt] = useState('')
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState<ImageSize>('2K')

  // 카테고리별 참조 이미지 (최대 14개, 카테고리당 2개)
  const [categoryRefImages, setCategoryRefImages] = useState<Record<string, string[]>>({})

  // 선택된 옵션 수
  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedOptions).reduce((sum, opts) => sum + opts.length, 0)
  }, [selectedOptions])

  // 참조 이미지 수
  const totalRefImageCount = useMemo(() => {
    return Object.values(categoryRefImages).reduce((sum, imgs) => sum + imgs.length, 0)
  }, [categoryRefImages])

  // 프롬프트 미리보기
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

  // 참조 이미지 추가
  const addCategoryRefImage = (category: string, imageUrl: string) => {
    setCategoryRefImages(prev => {
      const currentImages = prev[category] || []
      if (currentImages.length >= 2) return prev // 카테고리당 최대 2개
      const totalCount = Object.values(prev).reduce((sum, imgs) => sum + imgs.length, 0)
      if (totalCount >= 14) return prev // 전체 최대 14개
      return { ...prev, [category]: [...currentImages, imageUrl] }
    })
  }

  // 참조 이미지 삭제
  const removeCategoryRefImage = (category: string, index: number) => {
    setCategoryRefImages(prev => {
      const currentImages = prev[category] || []
      return { ...prev, [category]: currentImages.filter((_, i) => i !== index) }
    })
  }

  // 참조 이미지 업로드 핸들러
  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        addCategoryRefImage(selectedCategory, ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = '' // 같은 파일 재업로드 허용
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

    Object.entries(selectedOptions).forEach(([category, optIds]) => {
      const categoryOpts = CATEGORY_OPTIONS[category] || []
      optIds.forEach(optId => {
        const opt = categoryOpts.find(o => o.id === optId)
        if (opt && opt.prompt) {
          promptParts.push(opt.prompt)
        }
      })
    })

    if (customPrompt.trim()) {
      promptParts.push(customPrompt.trim())
    }

    if (promptParts.length === 0) {
      return bgInstruction
    }

    return `Keep the original character's identity. Apply these changes: ${promptParts.join(', ')}. ${bgInstruction}`
  }

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string)
        setResultImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  // 드래그 앤 드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string)
        setResultImage(null)
      }
      reader.readAsDataURL(file)
    }
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
    setStatusText('✏️ 편집 준비 중...')

    try {
      const sourceBase64 = sourceImage.split(',')[1]
      const prompt = buildFullPrompt()

      // 참조 이미지 수집 (base64로 변환)
      const allRefImages: string[] = []
      Object.values(categoryRefImages).forEach(imgs => {
        imgs.forEach(img => {
          if (img.includes(',')) {
            allRefImages.push(img.split(',')[1]) // data:image/...;base64, 제거
          }
        })
      })

      setStatusText(`🔄 이미지 분석 중... ${allRefImages.length > 0 ? `(참조 ${allRefImages.length}개)` : ''}`)
      const result = await editImage(
        apiKey,
        sourceBase64,
        prompt,
        MODELS[0].id,
        'image/png',
        allRefImages.length > 0 ? allRefImages : undefined,
        { imageSize: resolution }
      )

      let finalImage = result.url

      if (generateTransparent) {
        setStatusText('🎭 검정 배경 변환 중...')
        const blackResult = await editImage(
          apiKey,
          result.base64,
          'Change ONLY the background color from white to pure black #000000. Do NOT modify the character at all.',
          MODELS[0].id,
          'image/png',
          undefined,
          { imageSize: resolution }
        )

        setStatusText('✨ 투명 배경 생성 중...')
        const [whiteData, blackData] = await Promise.all([
          loadImageData(result.url),
          loadImageData(blackResult.url),
        ])

        const resultData = extractAlpha(whiteData, blackData)
        finalImage = imageDataToUrl(resultData)
      }

      setResultImage(finalImage)
      setStatusText('✅ 편집 완료!')
      onImageGenerated?.(finalImage, prompt)
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

    if (cat === 'settings') {
      return (
        <div className="settings-panel">
          <h3>⚙️ API 설정</h3>
          <div className="setting-group">
            <label>API 키</label>
            <div className="api-input-group">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Google AI API 키 입력..."
              />
              <button onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" checked={generateTransparent} onChange={(e) => setGenerateTransparent(e.target.checked)} />
            <span>🎭 투명 배경으로 생성</span>
          </div>
          <p className="checkbox-hint">
            {generateTransparent ? 'API 2회 호출' : 'API 1회 호출'}
          </p>

          <div className="setting-group">
            <label>📐 해상도</label>
            <div className="option-buttons">
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  className={`option-btn ${resolution === res.id ? 'active' : ''}`}
                  onClick={() => setResolution(res.id as ImageSize)}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSelectedOptions({})}
            style={{
              width: '100%',
              padding: 10,
              marginTop: 16,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            🔄 선택 초기화
          </button>
        </div>
      )
    }

    const options = CATEGORY_OPTIONS[cat] || []
    const selected = selectedOptions[cat] || []
    const catRefImages = categoryRefImages[cat] || []

    return (
      <div className="settings-panel">
        <h3>{EDIT_CATEGORIES.find(c => c.id === cat)?.icon} {EDIT_CATEGORIES.find(c => c.id === cat)?.name}</h3>
        <div className="option-buttons" style={{ marginBottom: 16 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              className={`option-btn ${selected.includes(opt.id) ? 'active' : ''}`}
              onClick={() => toggleOption(cat, opt.id)}
            >
              {selected.includes(opt.id) && '✓ '}
              {opt.label}
            </button>
          ))}
        </div>

        {/* 카테고리별 참조 이미지 */}
        <div className="setting-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            📎 참조 이미지 ({catRefImages.length}/2)
            <span style={{ fontSize: 10, color: '#888' }}>전체 {totalRefImageCount}/14</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {catRefImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: 60, height: 60 }}>
                <img
                  src={img}
                  alt={`ref-${idx}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <button
                  onClick={() => removeCategoryRefImage(cat, idx)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: 'none',
                    color: 'white',
                    fontSize: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {catRefImages.length < 2 && totalRefImageCount < 14 && (
              <label
                style={{
                  width: 60,
                  height: 60,
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                +
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRefImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="setting-group">
          <label>✏️ 추가 설명 (선택)</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="추가로 변경하고 싶은 내용을 입력하세요..."
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: 12,
              resize: 'vertical',
              minHeight: 80,
            }}
          />
        </div>

        {/* 선택된 프롬프트 미리보기 */}
        {previewPrompt.length > 0 && (
          <div className="setting-group" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8, fontWeight: 'bold' }}>
              📋 적용될 프롬프트 ({previewPrompt.length}개)
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {previewPrompt.map((prompt, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.8)',
                    padding: '4px 0',
                    borderBottom: idx < previewPrompt.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
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
    <div className="image-editor-layout">
      {/* 카테고리 사이드바 */}
      <div className="category-sidebar">
        {EDIT_CATEGORIES.map((cat) => {
          const hasSelection = (selectedOptions[cat.id]?.length || 0) > 0
          const hasRefImages = (categoryRefImages[cat.id]?.length || 0) > 0
          return (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ color: hasSelection || hasRefImages ? '#10b981' : undefined }}
            >
              <span className="icon">{cat.icon}</span>
              <span className="name">{cat.name}</span>
              {(hasSelection || hasRefImages) && <span style={{ fontSize: 8 }}>●</span>}
            </button>
          )
        })}
      </div>

      {/* 설정 패널 */}
      {renderSettingsPanel()}

      {/* 결과 사이드바 */}
      <div className="result-sidebar">
        <div className="result-header">
          <span>🖼️ 이미지</span>
          <span style={{ fontSize: 12, color: '#888' }}>{totalSelectedCount}개 선택</span>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
          {/* 원본 이미지 업로드 */}
          <div>
            <label style={{ fontSize: 12, color: '#f59e0b', marginBottom: 8, display: 'block' }}>원본 이미지</label>
            <div
              className={`upload-area ${sourceImage ? 'has-image' : ''}`}
              onClick={() => document.getElementById('image-upload')?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {sourceImage ? (
                <img src={sourceImage} alt="source" />
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>클릭/드롭하여 업로드</div>
                </div>
              )}
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* 결과 이미지 */}
          {resultImage && (
            <div>
              <label style={{ fontSize: 12, color: '#10b981', marginBottom: 8, display: 'block' }}>✨ 결과</label>
              <div style={{
                background: generateTransparent
                  ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                  : '#1a1a2e',
                borderRadius: 8,
                padding: 8,
              }}>
                <img src={resultImage} alt="result" style={{ width: '100%', borderRadius: 4 }} />
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
                  marginTop: 8,
                  padding: 10,
                  background: '#10b981',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ⬇️ PNG 다운로드
              </button>
            </div>
          )}

          {/* 상태 메시지 */}
          {statusText && (
            <div style={{
              padding: 12,
              background: statusText.includes('✅') ? 'rgba(16,185,129,0.1)' : statusText.includes('❌') || statusText.includes('⚠️') ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
              borderRadius: 8,
              fontSize: 13,
              textAlign: 'center',
              color: statusText.includes('✅') ? '#10b981' : statusText.includes('❌') || statusText.includes('⚠️') ? '#f87171' : '#818cf8',
            }}>
              {statusText}
            </div>
          )}
        </div>

        {/* 편집 버튼 */}
        <div className="generate-section">
          <button
            className="generate-btn"
            onClick={handleProcess}
            disabled={isProcessing || !apiKey || !sourceImage}
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            {isProcessing ? '⏳ 처리 중...' : '✏️ 편집 실행'}
          </button>
        </div>
      </div>
    </div>
  )
}
