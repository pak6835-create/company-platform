import { useState, useCallback, useMemo, useEffect } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { AIGeneratorNodeData } from '../types'
import { generateImage, editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS, IMAGE_SIZES, ASPECT_RATIOS } from '../utils/geminiApi'
import type { ImageSize, AspectRatio } from '../utils/geminiApi'

// ==================== 카테고리 및 옵션 데이터 ====================

const CATEGORIES = [
  { id: 'base', name: '베이스', icon: '👤' },
  { id: 'face', name: '얼굴', icon: '👦' },
  { id: 'hair', name: '머리카락', icon: '💇' },
  { id: 'top', name: '상의', icon: '👕' },
  { id: 'bottom', name: '하의', icon: '👖' },
  { id: 'shoes', name: '신발', icon: '👟' },
  { id: 'accessory', name: '악세서리', icon: '💍' },
  { id: 'weapon', name: '무기', icon: '⚔️' },
  { id: 'pose', name: '포즈', icon: '🏃' },
  { id: 'settings', name: '설정', icon: '⚙️' },
]

const OPTIONS_DATA: Record<string, Record<string, string[] | Record<string, string[]>>> = {
  base: {
    gender: ['남성', '여성'],
    bodyType: ['마름', '보통', '건장', '근육질', '통통'],
    height: ['5등신', '6등신', '7등신', '8등신'],
    age: ['10대', '20대', '30대', '40대+'],
  },
  face: {
    style: ['날카로운', '부드러운', '귀여운', '강인한', '차가운', '따뜻한', '신비로운'],
    eyes: ['큰 눈', '작은 눈', '날카로운 눈', '처진 눈', '올라간 눈'],
    skinTone: ['밝은', '보통', '어두운', '창백한'],
  },
  hair: {
    style: ['단발', '중발', '장발', '묶음머리', '올림머리', '대머리'],
    color: ['검정', '갈색', '금발', '빨강', '파랑', '은색', '분홍', '초록'],
  },
  top: {
    category: ['일상', '정장', '전투', '판타지', '학교', '전통'],
    items: {
      '일상': ['티셔츠', '셔츠', '후드티', '니트', '자켓'],
      '정장': ['정장 상의', '조끼', '블라우스'],
      '전투': ['전투복', '갑옷', '가죽 아머', '검은 코트'],
      '판타지': ['로브', '망토', '마법사 복'],
      '학교': ['교복 상의', '체육복'],
      '전통': ['한복 저고리', '기모노'],
    },
  },
  bottom: {
    category: ['일상', '정장', '전투', '판타지', '학교', '전통'],
    items: {
      '일상': ['청바지', '면바지', '반바지', '치마', '레깅스'],
      '정장': ['정장 바지', '정장 치마'],
      '전투': ['전투 바지', '갑옷 하의'],
      '판타지': ['로브 하의', '판타지 치마'],
      '학교': ['교복 바지', '교복 치마'],
      '전통': ['한복 치마', '한복 바지'],
    },
  },
  shoes: {
    item: ['운동화', '구두', '부츠', '샌들', '슬리퍼', '맨발', '전투화', '하이힐'],
  },
  accessory: {
    head: ['없음', '모자', '왕관', '머리띠', '안경', '선글라스', '귀걸이'],
    neck: ['없음', '목걸이', '스카프', '넥타이', '초커'],
    hands: ['없음', '반지', '장갑', '팔찌', '시계'],
    other: ['없음', '가방', '배낭', '날개', '꼬리'],
  },
  weapon: {
    category: ['없음', '검/도', '창/봉', '활/총', '마법', '기타'],
    items: {
      '검/도': ['장검', '단검', '대검', '이도류', '카타나'],
      '창/봉': ['창', '봉', '삼지창', '할버드'],
      '활/총': ['활', '석궁', '권총', '라이플'],
      '마법': ['지팡이', '마법봉', '오브', '마법책'],
      '기타': ['방패', '도끼', '낫', '채찍'],
    },
    position: ['오른손', '왼손', '양손', '등에', '허리에'],
  },
  pose: {
    angle: ['정면', '측면', '후면'],  // 간소화: 기본 스탠딩 포즈, 앵글만 선택
  },
}

// 해상도 옵션 (대문자 K 필수 - Gemini API 공식 문서 기준)
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K (1024px)', size: 1024 },
  { id: '2K', name: '2K (2048px)', size: 2048 },
  { id: '4K', name: '4K (4096px)', size: 4096 },
]

// 종횡비 옵션
const ASPECT_RATIO_OPTIONS = [
  { id: '16:9', name: '16:9 (가로)', width: 16, height: 9 },
  { id: '1:1', name: '1:1 (정사각)', width: 1, height: 1 },
  { id: '9:16', name: '9:16 (세로)', width: 9, height: 16 },
]

// MODELS는 utils/geminiApi.ts에서 import

// 기본 캐릭터 데이터
const DEFAULT_CHARACTER = {
  base: { gender: '남성', bodyType: '보통', height: '7등신', age: '20대' },
  face: { style: '날카로운', eyes: '날카로운 눈', skinTone: '보통' },
  hair: { style: '단발', color: '검정' },
  top: { category: '일상', item: '티셔츠' },
  bottom: { category: '일상', item: '청바지' },
  shoes: { item: '운동화' },
  accessory: { head: '없음', neck: '없음', hands: '없음', other: '없음' },
  weapon: { category: '없음', item: '', position: '오른손' },
  pose: { angle: '정면' },  // 간소화: 스탠딩 포즈 고정, 앵글만 선택
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

// ==================== 메인 컴포넌트 ====================

export function AIGeneratorNode({ data, selected, id }: NodeProps<AIGeneratorNodeData>) {
  const { setNodes } = useReactFlow()

  // API 설정
  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [model, setModel] = useState(data.model || MODELS[0].id)
  const [showApiKey, setShowApiKey] = useState(false)

  // 캐릭터 설정
  const [character, setCharacter] = useState<typeof DEFAULT_CHARACTER>(
    data.character || DEFAULT_CHARACTER
  )
  const [selectedCategory, setSelectedCategory] = useState('base')

  // UI 상태
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; prompt: string }>>([])
  const [generateTransparent, setGenerateTransparent] = useState(true) // 투명 배경 생성 옵션
  const [generationStatus, setGenerationStatus] = useState('')
  const [resolution, setResolution] = useState('2K') // 해상도 (대문자 K)
  const [aspectRatio, setAspectRatio] = useState('1:1') // 종횡비 (캐릭터는 정사각형 추천)

  // 노드 데이터 업데이트 (후처리 노드에서 접근 가능하도록)
  useEffect(() => {
    const imageUrl = generatedImages[0]?.url || null
    console.log('[AIGenerator] 노드 데이터 업데이트:', {
      id,
      hasApiKey: !!apiKey,
      model,
      hasImage: !!imageUrl,
      imageCount: generatedImages.length
    })

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              apiKey,
              model,
              lastGeneratedImage: imageUrl,
              lastPrompt: generatedImages[0]?.prompt || null,
            },
          }
        }
        return n
      })
    )
  }, [apiKey, model, generatedImages, id, setNodes])

  // ==================== 프롬프트 자동 생성 (간소화) ====================

  const generatedPrompt = useMemo(() => {
    const gender = character.base.gender === '남성' ? 'male' : 'female'
    const angle = character.pose.angle === '정면' ? 'front view' : character.pose.angle === '측면' ? 'side view' : 'back view'

    // 의상
    const outfit = [character.top.item, character.bottom.item, character.shoes.item].filter(Boolean).join(', ')

    // 악세서리
    const acc = [character.accessory.head, character.accessory.neck, character.accessory.hands, character.accessory.other]
      .filter(a => a && a !== '없음').join(', ')

    // 무기
    const weapon = character.weapon.category !== '없음' && character.weapon.item
      ? `holding ${character.weapon.item}`
      : ''

    // 간단한 프롬프트 (해상도/종횡비는 API 옵션으로 전달)
    return `Single ${gender} character, full body, standing, ${angle}, white background.
${character.base.age}, ${character.base.bodyType} build, ${character.base.height}.
${character.hair.color} ${character.hair.style} hair, ${character.face.style} face.
Wearing ${outfit || 'casual clothes'}${acc ? ', ' + acc : ''}${weapon ? ', ' + weapon : ''}.
Korean webtoon style, clean lines, cel-shaded.`
  }, [character])

  // ==================== 카테고리별 업데이트 함수 ====================

  const updateCharacter = useCallback(
    (category: string, field: string, value: string) => {
      setCharacter((prev) => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [field]: value,
        },
      }))
    },
    []
  )

  // ==================== AI 이미지 생성 ====================
  // 공통 API 함수는 utils/geminiApi.ts 사용

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('⚙️ 설정에서 API 키를 입력하세요')
      return
    }
    setIsGenerating(true)
    setError('')
    setGenerationStatus('')

    try {
      // 1단계: 흰배경 이미지 생성 (해상도/종횡비 옵션 포함)
      setGenerationStatus('1/3 흰배경 이미지 생성 중...')
      const imageOptions = {
        aspectRatio: aspectRatio as AspectRatio,
        imageSize: resolution as ImageSize,
      }
      const whiteResult = await generateImage(apiKey, generatedPrompt, model, imageOptions)

      // 투명 배경 생성이 꺼져있으면 여기서 끝
      if (!generateTransparent) {
        const newImage = { url: whiteResult.url, prompt: generatedPrompt.slice(0, 50) + '...' }
        setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
        emitAssetAdd({ url: whiteResult.url, prompt: generatedPrompt, timestamp: Date.now() })
        setGenerationStatus('✅ 완료!')
        return
      }

      // 2단계: 같은 이미지를 검정배경으로 편집 (순차 처리로 캐릭터 일관성 유지)
      setGenerationStatus('2/3 검정배경으로 변환 중...')
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        'Change the white background to solid pure black #000000. Keep everything else exactly the same. Do not modify the character at all, only change the background color.',
        model
      )

      // 3단계: 두 이미지 비교해서 알파 추출
      setGenerationStatus('3/3 투명 배경 생성 중...')
      const [whiteData, blackData] = await Promise.all([
        loadImageData(whiteResult.url),
        loadImageData(blackResult.url),
      ])

      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      const newImage = { url: transparentUrl, prompt: generatedPrompt.slice(0, 50) + '...' }
      setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
      emitAssetAdd({ url: transparentUrl, prompt: generatedPrompt, timestamp: Date.now() })
      setGenerationStatus('✅ 투명 배경 완료!')

      if (data.onGenerate) {
        data.onGenerate(transparentUrl, generatedPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      console.error('이미지 생성 오류:', err)
      setError(err instanceof Error ? err.message : '생성 실패')
      setGenerationStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  // ==================== 설정 패널 렌더링 ====================

  const renderSettingsPanel = () => {
    const cat = selectedCategory

    // 설정 카테고리
    if (cat === 'settings') {
      return (
        <div className="char-settings-panel">
          <h4>⚙️ API 설정</h4>
          <div className="setting-group">
            <label>API 키</label>
            <div className="api-key-row">
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
          <div className="setting-group">
            <label>AI 모델</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={generateTransparent}
                onChange={(e) => setGenerateTransparent(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>🎭 투명 배경으로 생성</span>
            </label>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 26px' }}>
              {generateTransparent
                ? '흰배경 → 검정배경 변환 → 알파 추출 (API 2회 호출)'
                : '흰배경 이미지만 생성 (API 1회 호출)'}
            </p>
          </div>
          <div className="setting-group">
            <label>📐 해상도</label>
            <div className="option-buttons">
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  className={resolution === res.id ? 'active' : ''}
                  onClick={() => setResolution(res.id)}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-group">
            <label>📏 종횡비</label>
            <div className="option-buttons">
              {ASPECT_RATIO_OPTIONS.map((ar) => (
                <button
                  key={ar.id}
                  className={aspectRatio === ar.id ? 'active' : ''}
                  onClick={() => setAspectRatio(ar.id)}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-group">
            <label>캐릭터 초기화</label>
            <button
              className="reset-btn"
              onClick={() => setCharacter(DEFAULT_CHARACTER)}
            >
              🔄 기본값으로 초기화
            </button>
          </div>
          <div className="setting-group api-help">
            <p>💡 Google AI Studio에서 API 키를 발급받으세요</p>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              API 키 발급하기 →
            </a>
          </div>
        </div>
      )
    }

    const opts = OPTIONS_DATA[cat]
    if (!opts) return null

    switch (cat) {
      case 'base':
        return (
          <div className="char-settings-panel">
            <h4>👤 베이스 설정</h4>
            <div className="setting-group">
              <label>성별</label>
              <div className="option-buttons">
                {(opts.gender as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.gender === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'gender', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>체형</label>
              <div className="option-buttons">
                {(opts.bodyType as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.bodyType === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'bodyType', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>등신</label>
              <div className="option-buttons">
                {(opts.height as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.height === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'height', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>연령대</label>
              <div className="option-buttons">
                {(opts.age as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.age === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'age', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'face':
        return (
          <div className="char-settings-panel">
            <h4>👦 얼굴 설정</h4>
            <div className="setting-group">
              <label>스타일</label>
              <div className="option-buttons">
                {(opts.style as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.style === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'style', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>눈</label>
              <div className="option-buttons">
                {(opts.eyes as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.eyes === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'eyes', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>피부톤</label>
              <div className="option-buttons">
                {(opts.skinTone as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.skinTone === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'skinTone', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'hair':
        return (
          <div className="char-settings-panel">
            <h4>💇 머리카락 설정</h4>
            <div className="setting-group">
              <label>스타일</label>
              <div className="option-buttons">
                {(opts.style as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.hair.style === opt ? 'active' : ''}
                    onClick={() => updateCharacter('hair', 'style', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>색상</label>
              <div className="option-buttons">
                {(opts.color as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.hair.color === opt ? 'active' : ''}
                    onClick={() => updateCharacter('hair', 'color', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'top':
        const topItems = (opts.items as Record<string, string[]>)[character.top.category] || []
        return (
          <div className="char-settings-panel">
            <h4>👕 상의 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.top.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('top', 'category', opt)
                      const items = (OPTIONS_DATA.top.items as Record<string, string[]>)[opt]
                      if (items && items.length > 0) {
                        updateCharacter('top', 'item', items[0])
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>아이템</label>
              <div className="option-buttons">
                {topItems.map((opt) => (
                  <button
                    key={opt}
                    className={character.top.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('top', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'bottom':
        const bottomItems = (opts.items as Record<string, string[]>)[character.bottom.category] || []
        return (
          <div className="char-settings-panel">
            <h4>👖 하의 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.bottom.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('bottom', 'category', opt)
                      const items = (OPTIONS_DATA.bottom.items as Record<string, string[]>)[opt]
                      if (items && items.length > 0) {
                        updateCharacter('bottom', 'item', items[0])
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>아이템</label>
              <div className="option-buttons">
                {bottomItems.map((opt) => (
                  <button
                    key={opt}
                    className={character.bottom.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('bottom', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'shoes':
        return (
          <div className="char-settings-panel">
            <h4>👟 신발 설정</h4>
            <div className="setting-group">
              <label>신발</label>
              <div className="option-buttons">
                {(opts.item as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.shoes.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('shoes', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'accessory':
        return (
          <div className="char-settings-panel">
            <h4>💍 악세서리 설정</h4>
            <div className="setting-group">
              <label>머리</label>
              <div className="option-buttons">
                {(opts.head as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.head === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'head', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>목</label>
              <div className="option-buttons">
                {(opts.neck as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.neck === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'neck', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>손</label>
              <div className="option-buttons">
                {(opts.hands as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.hands === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'hands', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>기타</label>
              <div className="option-buttons">
                {(opts.other as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.other === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'other', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'weapon':
        const weaponItems =
          character.weapon.category !== '없음'
            ? (opts.items as Record<string, string[]>)[character.weapon.category] || []
            : []
        return (
          <div className="char-settings-panel">
            <h4>⚔️ 무기 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.weapon.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('weapon', 'category', opt)
                      if (opt !== '없음') {
                        const items = (OPTIONS_DATA.weapon.items as Record<string, string[]>)[opt]
                        if (items && items.length > 0) {
                          updateCharacter('weapon', 'item', items[0])
                        }
                      } else {
                        updateCharacter('weapon', 'item', '')
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {character.weapon.category !== '없음' && (
              <>
                <div className="setting-group">
                  <label>무기</label>
                  <div className="option-buttons">
                    {weaponItems.map((opt) => (
                      <button
                        key={opt}
                        className={character.weapon.item === opt ? 'active' : ''}
                        onClick={() => updateCharacter('weapon', 'item', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setting-group">
                  <label>위치</label>
                  <div className="option-buttons">
                    {(opts.position as string[]).map((opt) => (
                      <button
                        key={opt}
                        className={character.weapon.position === opt ? 'active' : ''}
                        onClick={() => updateCharacter('weapon', 'position', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 'pose':
        return (
          <div className="char-settings-panel">
            <h4>🏃 포즈 설정</h4>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              기본 스탠딩 포즈로 고정, 각도만 선택 가능
            </p>
            <div className="setting-group">
              <label>각도 (전신 스탠딩 포즈)</label>
              <div className="option-buttons">
                {(opts.angle as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.angle === opt ? 'active' : ''}
                    onClick={() => updateCharacter('pose', 'angle', opt)}
                  >
                    {opt === '정면' ? '👤 정면' : opt === '측면' ? '👤 측면' : '👤 후면'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ==================== 렌더링 ====================

  return (
    <div className={`ai-generator-node-v2 ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="ref-in" />
      <NodeResizer isVisible={selected} minWidth={600} minHeight={500} />

      {/* 헤더 */}
      <div className="aig-header">
        <span>🎨 캐릭터 메이커</span>
        <span className="aig-model-badge">{MODELS.find(m => m.id === model)?.name || model}</span>
      </div>

      <div className="aig-body nodrag" onMouseDown={(e) => e.stopPropagation()}>
        <div className="aig-main-layout">
          {/* 왼쪽: 카테고리 목록 */}
          <div className="aig-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`aig-category-btn ${selectedCategory === cat.id ? 'active' : ''} ${cat.id === 'settings' ? 'settings-btn' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* 중앙: 설정 패널 */}
          <div className="aig-settings-content">{renderSettingsPanel()}</div>

          {/* 오른쪽: 생성된 이미지 갤러리 */}
          <div className="aig-gallery-sidebar">
            <div className="gallery-header">
              <span>📸 결과</span>
              {generatedImages.length > 0 && (
                <button className="clear-btn" onClick={() => setGeneratedImages([])}>
                  🗑️
                </button>
              )}
            </div>
            <div className="gallery-scroll">
              {generatedImages.length === 0 ? (
                <div className="gallery-empty">
                  <p>생성된 이미지가<br/>여기에 표시됩니다</p>
                </div>
              ) : (
                generatedImages.map((img, idx) => (
                  <div key={idx} className="gallery-item">
                    <img
                      src={img.url}
                      alt={`생성 ${idx + 1}`}
                      onClick={() => window.open(img.url, '_blank')}
                      title={img.prompt}
                    />
                    <button
                      className="download-btn"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = img.url
                        link.download = `character-${Date.now()}.png`
                        link.click()
                      }}
                    >
                      ⬇️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 프롬프트 미리보기 */}
        <div className="aig-prompt-preview">
          <label>🤖 자동 생성 프롬프트</label>
          <p>{generatedPrompt}</p>
        </div>

        {/* 에러 */}
        {error && <div className="aig-error">{error}</div>}

        {/* 생성 버튼 */}
        {/* 진행 상태 표시 */}
        {generationStatus && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 8,
            background: generationStatus.includes('✅') ? '#d4edda' : '#e3f2fd',
            borderRadius: 6,
            fontSize: 12,
            textAlign: 'center',
            color: generationStatus.includes('✅') ? '#155724' : '#1565c0',
          }}>
            {generationStatus}
          </div>
        )}
        <button
          className="aig-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
        >
          {isGenerating
            ? '⏳ 생성 중...'
            : generateTransparent
              ? '🎭 투명 배경 이미지 생성'
              : '🚀 AI 이미지 생성'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}
