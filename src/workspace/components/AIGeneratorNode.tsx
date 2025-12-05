import { useState, useCallback, useMemo, useEffect } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { AIGeneratorNodeData } from '../types'

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
    category: ['기본', '전투', '일상', '감정', '액션'],
    poses: {
      '기본': ['서있기', '앉기', '무릎꿇기', '누워있기'],
      '전투': ['검 들기', '방어 자세', '공격 자세', '마법 시전'],
      '일상': ['걷기', '손 흔들기', '팔짱', '주머니에 손'],
      '감정': ['기쁨', '슬픔', '분노', '놀람'],
      '액션': ['달리기', '점프', '회전', '착지'],
    },
    angle: ['정면', '측면', '뒷면', '3/4'],
    direction: ['왼쪽 보기', '정면 보기', '오른쪽 보기'],
  },
}

// Gemini 이미지 생성 모델 목록 (최신순)
// 공식 문서: https://ai.google.dev/gemini-api/docs/image-generation
const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: '나노바나나 Pro (최신)' },
  { id: 'gemini-2.5-flash-image', name: '나노바나나 2.5' },
  { id: 'gemini-2.0-flash-preview-image-generation', name: '나노바나나 2.0' },
]

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
  pose: { category: '기본', pose: '서있기', angle: '3/4', direction: '정면 보기' },
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

  // 노드 데이터 업데이트 (후처리 노드에서 접근 가능하도록)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              apiKey,
              model,
              lastGeneratedImage: generatedImages[0]?.url || null,
              lastPrompt: generatedImages[0]?.prompt || null,
            },
          }
        }
        return n
      })
    )
  }, [apiKey, model, generatedImages, id, setNodes])

  // ==================== 프롬프트 자동 생성 ====================

  const generatedPrompt = useMemo(() => {
    const parts: string[] = []

    // 베이스
    parts.push(character.base.gender === '남성' ? 'male' : 'female')
    parts.push(`${character.base.bodyType} build`)
    parts.push(character.base.height)
    parts.push(character.base.age)

    // 얼굴
    parts.push(`${character.face.style} face`)
    parts.push(character.face.eyes)
    parts.push(`${character.face.skinTone} skin`)

    // 머리
    parts.push(`${character.hair.color} ${character.hair.style} hair`)

    // 의상
    if (character.top.item) {
      parts.push(`wearing ${character.top.item}`)
    }
    if (character.bottom.item) {
      parts.push(`and ${character.bottom.item}`)
    }
    if (character.shoes.item) {
      parts.push(character.shoes.item)
    }

    // 악세서리
    const accessories = []
    if (character.accessory.head !== '없음') accessories.push(character.accessory.head)
    if (character.accessory.neck !== '없음') accessories.push(character.accessory.neck)
    if (character.accessory.hands !== '없음') accessories.push(character.accessory.hands)
    if (character.accessory.other !== '없음') accessories.push(character.accessory.other)
    if (accessories.length > 0) {
      parts.push(`with ${accessories.join(', ')}`)
    }

    // 무기
    if (character.weapon.category !== '없음' && character.weapon.item) {
      parts.push(`holding ${character.weapon.item} in ${character.weapon.position}`)
    }

    // 포즈
    parts.push(`${character.pose.pose} pose`)
    parts.push(`${character.pose.angle} view`)
    parts.push(`looking ${character.pose.direction}`)

    // 스타일 + 흰색 배경 (배경 제거를 위해)
    parts.push('webtoon style', 'clean lines', 'high quality', 'detailed')
    parts.push('pure white background', 'solid white background', 'isolated character on white')

    return parts.join(', ')
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

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('⚙️ 설정에서 API 키를 입력하세요')
      return
    }
    setIsGenerating(true)
    setError('')

    try {
      // Gemini 이미지 생성 API (모든 모델 동일한 엔드포인트)
      // 공식 문서: https://ai.google.dev/gemini-api/docs/image-generation
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const requestBody = {
        contents: [{ parts: [{ text: generatedPrompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        },
      }

      console.log('API 요청:', { model, endpoint: endpoint.replace(apiKey, '***') })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      console.log('API 응답:', result)

      if (result.error) {
        throw new Error(result.error.message || JSON.stringify(result.error))
      }

      // 응답에서 이미지 데이터 추출
      let imageUrl: string | null = null
      const parts = result.candidates?.[0]?.content?.parts || []

      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png'
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
          break
        }
      }

      if (!imageUrl) {
        // 디버깅을 위한 상세 정보
        console.error('응답 구조:', JSON.stringify(result, null, 2))
        throw new Error('이미지 생성 실패 - 응답에 이미지 데이터가 없습니다')
      }

      const newImage = { url: imageUrl, prompt: generatedPrompt.slice(0, 50) + '...' }
      setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))

      emitAssetAdd({ url: imageUrl, prompt: generatedPrompt, timestamp: Date.now() })

      if (data.onGenerate) {
        data.onGenerate(imageUrl, generatedPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      console.error('이미지 생성 오류:', err)
      setError(err instanceof Error ? err.message : '생성 실패')
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
        const poseItems = (opts.poses as Record<string, string[]>)[character.pose.category] || []
        return (
          <div className="char-settings-panel">
            <h4>🏃 포즈 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('pose', 'category', opt)
                      const poses = (OPTIONS_DATA.pose.poses as Record<string, string[]>)[opt]
                      if (poses && poses.length > 0) {
                        updateCharacter('pose', 'pose', poses[0])
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>포즈</label>
              <div className="option-buttons">
                {poseItems.map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.pose === opt ? 'active' : ''}
                    onClick={() => updateCharacter('pose', 'pose', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>각도</label>
              <div className="option-buttons">
                {(opts.angle as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.angle === opt ? 'active' : ''}
                    onClick={() => updateCharacter('pose', 'angle', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>방향</label>
              <div className="option-buttons">
                {(opts.direction as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.direction === opt ? 'active' : ''}
                    onClick={() => updateCharacter('pose', 'direction', opt)}
                  >
                    {opt}
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
        <button
          className="aig-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
        >
          {isGenerating ? '⏳ 생성 중...' : '🚀 AI 이미지 생성'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}
