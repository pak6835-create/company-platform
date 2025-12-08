import { useState, useEffect, useRef, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, MODELS, extractAlpha, loadImageData, imageDataToUrl, AspectRatio, ImageSize } from '../utils/geminiApi'

/**
 * 편집 노드 (구 포즈 변경 노드)
 *
 * 기능:
 * - 왼쪽 핸들: 캐릭터/이미지 노드 연결
 * - 오른쪽 핸들: 참조 이미지 연결 (포즈, 스타일 등)
 * - 편집 유형: 포즈, 날씨, 시간, 옷, 무기, 표정, 헤어, 커스텀
 * - 투명 배경, 해상도, 종횡비 옵션
 */

interface EditNodeData {
  apiKey?: string
  characterImage?: string
}

// 편집 유형 정의
const EDIT_TYPES = [
  { id: 'pose', name: '포즈', icon: '🕺', description: '캐릭터의 포즈/자세 변경' },
  { id: 'weather', name: '날씨', icon: '🌤️', description: '배경 날씨 변경' },
  { id: 'time', name: '시간', icon: '🌙', description: '시간대/조명 변경' },
  { id: 'clothes', name: '옷', icon: '👕', description: '의상 변경' },
  { id: 'weapon', name: '무기', icon: '⚔️', description: '무기/아이템 변경' },
  { id: 'expression', name: '표정', icon: '😊', description: '표정/감정 변경' },
  { id: 'hair', name: '헤어', icon: '💇', description: '헤어스타일/색상 변경' },
  { id: 'custom', name: '커스텀', icon: '✏️', description: '직접 입력' },
]

// 날씨 옵션
const WEATHER_OPTIONS = [
  { id: 'sunny', name: '맑음', prompt: 'bright sunny day with clear blue sky' },
  { id: 'cloudy', name: '흐림', prompt: 'overcast cloudy sky, soft diffused light' },
  { id: 'rainy', name: '비', prompt: 'rainy weather with raindrops and wet surfaces' },
  { id: 'snowy', name: '눈', prompt: 'snowy weather with falling snowflakes' },
  { id: 'foggy', name: '안개', prompt: 'foggy misty atmosphere' },
  { id: 'stormy', name: '폭풍', prompt: 'stormy weather with dark clouds and lightning' },
]

// 시간 옵션
const TIME_OPTIONS = [
  { id: 'dawn', name: '새벽', prompt: 'early dawn, soft pink and orange sky, gentle light' },
  { id: 'morning', name: '아침', prompt: 'bright morning light, warm golden hour' },
  { id: 'noon', name: '정오', prompt: 'midday harsh sunlight, strong shadows' },
  { id: 'afternoon', name: '오후', prompt: 'late afternoon warm light' },
  { id: 'sunset', name: '일몰', prompt: 'sunset golden hour, orange and red sky' },
  { id: 'night', name: '밤', prompt: 'nighttime with moonlight and stars' },
]

// 표정 옵션
const EXPRESSION_OPTIONS = [
  { id: 'happy', name: '행복', prompt: 'happy smiling expression with bright eyes' },
  { id: 'sad', name: '슬픔', prompt: 'sad melancholic expression with teary eyes' },
  { id: 'angry', name: '화남', prompt: 'angry fierce expression with furrowed brows' },
  { id: 'surprised', name: '놀람', prompt: 'surprised shocked expression with wide eyes' },
  { id: 'scared', name: '공포', prompt: 'scared terrified expression' },
  { id: 'serious', name: '진지', prompt: 'serious determined expression' },
  { id: 'shy', name: '수줍', prompt: 'shy blushing expression' },
  { id: 'smirk', name: '능글', prompt: 'confident smirking expression' },
]

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

  const refInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)

  // 이미지 상태
  const [connectedImage, setConnectedImage] = useState<string | null>(null)
  const [uploadedCharacter, setUploadedCharacter] = useState<string | null>(null)
  const [connectedRef, setConnectedRef] = useState<string | null>(null)
  const [uploadedRef, setUploadedRef] = useState<string | null>(null)

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 편집 유형 상태
  const [editType, setEditType] = useState('pose')
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [clothesDesc, setClothesDesc] = useState('')
  const [weaponDesc, setWeaponDesc] = useState('')
  const [hairDesc, setHairDesc] = useState('')

  // 옵션 상태
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState<ImageSize>('2K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // 실제 사용할 이미지
  const characterImage = uploadedCharacter || connectedImage
  const refImage = uploadedRef || connectedRef

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 캐릭터 엣지 ID 추적
  const connectedCharacterEdgeId = useMemo(() => {
    if (!Array.isArray(edges)) return null
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'character-in')
    return edge?.source || null
  }, [edges, id])

  // 연결된 참조 엣지 ID 추적
  const connectedRefEdgeId = useMemo(() => {
    if (!Array.isArray(edges)) return null
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'ref-in')
    return edge?.source || null
  }, [edges, id])

  // 연결된 캐릭터 노드에서 이미지 가져오기
  useEffect(() => {
    if (!connectedCharacterEdgeId) {
      setConnectedImage(null)
      return
    }

    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === connectedCharacterEdgeId)
    if (sourceNode) {
      const imageUrl = sourceNode.data?.imageUrl ||
                      sourceNode.data?.url ||
                      sourceNode.data?.resultImage ||
                      sourceNode.data?.generatedImage
      if (imageUrl) {
        setConnectedImage(imageUrl)
        setUploadedCharacter(null)
      }
    }
  }, [connectedCharacterEdgeId, getNodes])

  // 연결된 참조 노드에서 이미지 가져오기
  useEffect(() => {
    if (!connectedRefEdgeId) {
      setConnectedRef(null)
      return
    }

    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === connectedRefEdgeId)
    if (sourceNode) {
      const imageUrl = sourceNode.data?.imageUrl ||
                      sourceNode.data?.url ||
                      sourceNode.data?.resultImage ||
                      sourceNode.data?.generatedImage
      if (imageUrl) {
        setConnectedRef(imageUrl)
        setUploadedRef(null)
      }
    }
  }, [connectedRefEdgeId, getNodes])

  // 캐릭터 업로드 핸들러
  const handleCharacterUpload = (imageUrl: string) => {
    setUploadedCharacter(imageUrl)
    setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'character-in')))
    setConnectedImage(null)
    setResultImage(null)
    setStatusText('')
    setProgress(0)
  }

  // 참조 이미지 업로드 핸들러
  const handleRefUpload = (imageUrl: string) => {
    setUploadedRef(imageUrl)
    setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'ref-in')))
    setConnectedRef(null)
    setResultImage(null)
    setStatusText('')
    setProgress(0)
  }

  // 드래그 앤 드롭 처리
  const handleDrop = (e: React.DragEvent, target: 'character' | 'ref') => {
    e.preventDefault()
    e.stopPropagation()

    const jsonData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData)
        if (parsed.type === 'asset' && parsed.url) {
          if (target === 'character') {
            handleCharacterUpload(parsed.url)
          } else {
            handleRefUpload(parsed.url)
          }
          return
        }
      } catch (err) {
        // JSON 파싱 실패 시 파일로 처리
      }
    }

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (target === 'character') {
          handleCharacterUpload(dataUrl)
        } else {
          handleRefUpload(dataUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // 편집 프롬프트 생성
  const buildEditPrompt = (): string => {
    const bgInstruction = generateTransparent
      ? 'Use a pure solid white background (#FFFFFF).'
      : ''

    switch (editType) {
      case 'pose':
        return `Keep the character's appearance, clothing, and style from the first image. Change the pose to match the second image. Also match the camera angle from the second image. ${bgInstruction}`

      case 'weather':
        const weatherOpt = WEATHER_OPTIONS.find(w => w.id === selectedOption)
        return `Keep the character exactly the same. Change the background weather to: ${weatherOpt?.prompt || selectedOption}. ${bgInstruction}`

      case 'time':
        const timeOpt = TIME_OPTIONS.find(t => t.id === selectedOption)
        return `Keep the character exactly the same. Change the lighting and atmosphere to: ${timeOpt?.prompt || selectedOption}. ${bgInstruction}`

      case 'clothes':
        return `Keep the character's face, pose, and hairstyle exactly the same. Change only the clothing to: ${clothesDesc}. ${bgInstruction}`

      case 'weapon':
        return `Keep the character exactly the same. Add or change the weapon/item to: ${weaponDesc}. The character should be holding or wielding this weapon naturally. ${bgInstruction}`

      case 'expression':
        const exprOpt = EXPRESSION_OPTIONS.find(e => e.id === selectedOption)
        return `Keep the character's body, clothes, and pose exactly the same. Change only the facial expression to: ${exprOpt?.prompt || selectedOption}. ${bgInstruction}`

      case 'hair':
        return `Keep the character's face, clothes, and pose exactly the same. Change only the hairstyle to: ${hairDesc}. ${bgInstruction}`

      case 'custom':
        return `${customPrompt} ${bgInstruction}`

      default:
        return bgInstruction
    }
  }

  // 편집 실행
  const handleProcess = async () => {
    if (!apiKey) {
      setStatusText('⚠️ API 키를 입력하세요')
      return
    }
    if (!characterImage) {
      setStatusText('⚠️ 이미지를 연결하거나 업로드하세요')
      return
    }

    // 포즈 변경 시 참조 이미지 필요
    if (editType === 'pose' && !refImage) {
      setStatusText('⚠️ 포즈 참조 이미지를 업로드하세요')
      return
    }

    // 옵션 검증
    if ((editType === 'weather' || editType === 'time' || editType === 'expression') && !selectedOption) {
      setStatusText('⚠️ 옵션을 선택하세요')
      return
    }
    if (editType === 'clothes' && !clothesDesc) {
      setStatusText('⚠️ 의상 설명을 입력하세요')
      return
    }
    if (editType === 'weapon' && !weaponDesc) {
      setStatusText('⚠️ 무기/아이템 설명을 입력하세요')
      return
    }
    if (editType === 'hair' && !hairDesc) {
      setStatusText('⚠️ 헤어스타일 설명을 입력하세요')
      return
    }
    if (editType === 'custom' && !customPrompt) {
      setStatusText('⚠️ 편집 내용을 입력하세요')
      return
    }

    setIsProcessing(true)
    setResultImage(null)
    setProgress(0)

    const editTypeInfo = EDIT_TYPES.find(t => t.id === editType)
    setStatusText(`${editTypeInfo?.icon} ${editTypeInfo?.name} 편집 중...`)

    try {
      const characterBase64 = characterImage.split(',')[1]
      const refBase64 = refImage ? refImage.split(',')[1] : undefined
      const model = MODELS[0].id
      const prompt = buildEditPrompt()

      setProgress(10)
      setStatusText('🔄 이미지 분석 중...')

      const result = await editImage(
        apiKey,
        characterBase64,
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
          'Change ONLY the background color from white to pure black #000000. Do NOT modify the character at all. Keep everything else exactly the same.',
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
        prompt: `${editTypeInfo?.name} 편집`,
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

  // 현재 편집 유형에 따른 옵션 UI
  const renderEditOptions = () => {
    switch (editType) {
      case 'weather':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              🌤️ 날씨 선택
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {WEATHER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 4,
                    border: 'none',
                    background: selectedOption === opt.id ? '#f59e0b' : '#3f3f46',
                    color: selectedOption === opt.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: selectedOption === opt.id ? 'bold' : 'normal',
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )

      case 'time':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              🌙 시간대 선택
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 4,
                    border: 'none',
                    background: selectedOption === opt.id ? '#f59e0b' : '#3f3f46',
                    color: selectedOption === opt.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: selectedOption === opt.id ? 'bold' : 'normal',
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )

      case 'expression':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              😊 표정 선택
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {EXPRESSION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 4,
                    border: 'none',
                    background: selectedOption === opt.id ? '#f59e0b' : '#3f3f46',
                    color: selectedOption === opt.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: selectedOption === opt.id ? 'bold' : 'normal',
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )

      case 'clothes':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              👕 의상 설명
            </label>
            <textarea
              value={clothesDesc}
              onChange={(e) => setClothesDesc(e.target.value)}
              placeholder="예: 검은색 정장, 캐주얼한 청바지와 흰 티셔츠, 중세 갑옷..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
                resize: 'none',
                minHeight: 60,
              }}
            />
          </div>
        )

      case 'weapon':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              ⚔️ 무기/아이템 설명
            </label>
            <textarea
              value={weaponDesc}
              onChange={(e) => setWeaponDesc(e.target.value)}
              placeholder="예: 빛나는 장검, 마법 지팡이, 활과 화살, 방패..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
                resize: 'none',
                minHeight: 60,
              }}
            />
          </div>
        )

      case 'hair':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              💇 헤어스타일 설명
            </label>
            <textarea
              value={hairDesc}
              onChange={(e) => setHairDesc(e.target.value)}
              placeholder="예: 금발 롱헤어, 검은 단발머리, 빨간색 포니테일..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
                resize: 'none',
                minHeight: 60,
              }}
            />
          </div>
        )

      case 'custom':
        return (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              ✏️ 커스텀 편집 내용
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="원하는 편집 내용을 자유롭게 입력하세요..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
                resize: 'none',
                minHeight: 80,
              }}
            />
          </div>
        )

      case 'pose':
      default:
        return null
    }
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
        minHeight: 650,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={420} minHeight={650} />

      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '12px 16px',
          borderRadius: '10px 10px 0 0',
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        ✏️ 편집
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
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
        {/* 편집 유형 선택 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 6 }}>
            편집 유형
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {EDIT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setEditType(type.id)
                  setSelectedOption('')
                  setResultImage(null)
                  setStatusText('')
                }}
                title={type.description}
                style={{
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: 'none',
                  background: editType === type.id ? '#f59e0b' : '#3f3f46',
                  color: editType === type.id ? '#000' : '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: editType === type.id ? 'bold' : 'normal',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 편집 유형별 옵션 */}
        {renderEditOptions()}

        {/* 옵션 패널 */}
        <div style={{
          background: '#2a2a3e',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          border: '1px solid #444',
        }}>
          {/* 투명 배경 옵션 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
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

          {/* 해상도 옵션 */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              📐 해상도
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id as ImageSize)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
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

          {/* 종횡비 옵션 */}
          <div>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              📏 종횡비
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {ASPECT_RATIO_OPTIONS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: aspectRatio === ar.id ? '#f59e0b' : '#3f3f46',
                    color: aspectRatio === ar.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: aspectRatio === ar.id ? 'bold' : 'normal',
                  }}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>
        </div>

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

        {/* 2열 레이아웃: 원본 | 참조 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {/* 왼쪽: 원본 이미지 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🖼️ 원본 {connectedImage ? '(노드 연결)' : uploadedCharacter ? '(업로드)' : ''}</span>
              {characterImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedCharacter(null)
                    setEdges((eds) => eds.filter((edge) => !(edge.target === id && edge.targetHandle === 'character-in')))
                    setConnectedImage(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 4px',
                  }}
                  title="이미지 삭제"
                >
                  ✕
                </button>
              )}
            </div>
            <div
              onDrop={(e) => handleDrop(e, 'character')}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      handleCharacterUpload(ev.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
              style={{
                border: `2px dashed ${connectedImage ? '#10b981' : '#f59e0b'}`,
                borderRadius: 6,
                padding: 6,
                textAlign: 'center',
                cursor: 'pointer',
                background: characterImage ? 'transparent' : '#2a2a3e',
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {characterImage ? (
                <img
                  src={characterImage}
                  alt="character"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 70,
                    borderRadius: 4,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, color: '#888' }}>
                  클릭/드롭하여 업로드
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 참조 이미지 (포즈 변경 시에만 표시) */}
          {editType === 'pose' && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🕺 포즈 참조 {connectedRef ? '(노드 연결)' : uploadedRef ? '(업로드)' : ''}</span>
                {refImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedRef(null)
                      setEdges((eds) => eds.filter((edge) => !(edge.target === id && edge.targetHandle === 'ref-in')))
                      setConnectedRef(null)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: 10,
                      padding: '2px 4px',
                    }}
                    title="이미지 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div
                onClick={() => refInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'ref')}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'copy'
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                style={{
                  border: `2px dashed #10b981`,
                  borderRadius: 6,
                  padding: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: refImage ? 'transparent' : '#2a2a3e',
                  minHeight: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {refImage ? (
                  <img
                    src={refImage}
                    alt="reference"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 70,
                      borderRadius: 4,
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 10, color: '#888' }}>
                    클릭/드롭하여 업로드
                  </div>
                )}
                <input
                  ref={refInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        handleRefUpload(event.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 처리 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !characterImage}
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
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : `✏️ ${EDIT_TYPES.find(t => t.id === editType)?.name} 편집 실행`}
        </button>

        {/* 로딩 프로그레스바 */}
        {isProcessing && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#aaa',
              marginBottom: 4,
            }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: '#2a2a3e',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #10b981 100%)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* 완료/에러 상태 */}
        {!isProcessing && statusText && (
          <div
            style={{
              padding: '6px 10px',
              background: statusText.includes('✅') ? '#1a3d1a' : statusText.includes('❌') ? '#3d1a1a' : '#2a2a3e',
              borderRadius: 4,
              fontSize: 11,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {statusText}
          </div>
        )}

        {/* 결과 이미지 */}
        {resultImage && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold' }}>
              ✨ 결과
            </div>
            <div style={{
              background: generateTransparent
                ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                : '#2a2a3e',
              borderRadius: 6,
              padding: 4,
              overflow: 'hidden',
            }}>
              <img
                src={resultImage}
                alt="Result"
                style={{
                  width: '100%',
                  maxHeight: 180,
                  objectFit: 'contain',
                  borderRadius: 4,
                  display: 'block',
                }}
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

      {/* 핸들 - 원본 입력 (왼쪽 상단) */}
      <Handle
        type="target"
        position={Position.Left}
        id="character-in"
        style={{
          top: '30%',
          background: '#f59e0b',
          width: 12,
          height: 12,
        }}
      />
      {/* 핸들 - 참조 입력 (왼쪽 하단) */}
      <Handle
        type="target"
        position={Position.Left}
        id="ref-in"
        style={{
          top: '60%',
          background: '#10b981',
          width: 12,
          height: 12,
        }}
      />
      {/* 핸들 - 결과 출력 (오른쪽) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#10b981',
          width: 12,
          height: 12,
        }}
      />
    </div>
  )
}
