/**
 * AI 스튜디오 v9.6 - React 버전
 * 캐릭터/배경 이미지 생성기
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSharedLibrary } from '../../context/SharedLibraryContext'
import {
  CHAR_CATEGORIES,
  BG_CATEGORIES,
  ASSET_CATEGORIES,
  CHAR_PRESETS,
  BG_PRESETS,
  ASSET_PRESETS,
  getColorName,
  getColorNameKo,
  getColorPrompt,
  hslToHex,
  type Category,
  type SliderItem,
  type TagItem,
  type Preset,
} from './data'
import { generateImage, generateImageModelScope, editImage, createTransparentImage, MODELS, HIGH_RES_MODELS, getModelProvider, type ImageSize, type AspectRatio, IMAGE_SIZES, ASPECT_RATIOS } from './geminiApi'
import './AIStudio.css'

// 참조 이미지 역할 정의
const REF_ROLES = [
  { id: 'style', name: '화풍', icon: '🎨', prompt: 'match the art style and color palette' },
  { id: 'pose', name: '포즈', icon: '🏃', prompt: 'match the pose and body position' },
  { id: 'outfit', name: '의상', icon: '👕', prompt: 'use the same outfit and clothing' },
  { id: 'color', name: '색감', icon: '🌈', prompt: 'use the same color scheme' },
  { id: 'face', name: '얼굴', icon: '👤', prompt: 'match the facial features' },
  { id: 'bg', name: '배경', icon: '🏞️', prompt: 'use the same background' },
  { id: 'object', name: '오브젝트', icon: '📦', prompt: 'include this object in the image' },
] as const

// 참조 이미지 타입
interface RefImage {
  url: string
  b64: string
  type: string  // REF_ROLES의 id
  strength: number
}

// 라이브러리 이미지 타입
interface LibraryImage {
  url: string
  b64: string
  prompt?: string
}

// 상태 타입
interface PageState {
  cat: string
  values: Record<string, unknown>
  negTags: string[]
  refImgs: RefImage[]
}

// 생성 중인 이미지 슬롯
interface GeneratingSlot {
  id: string
  index: number
  status: 'generating' | 'transparent' | 'cancelled' | 'failed'
  error?: string
  progress?: string // 진행 상태 메시지
}

type PageType = 'char' | 'bg' | 'asset'

interface AIStudioProps {
  onImageGenerated?: (url: string, prompt: string) => void
}

export function AIStudio({ onImageGenerated }: AIStudioProps) {
  const navigate = useNavigate()
  const { assets: sharedAssets, addAsset: addSharedAsset, removeAsset: removeSharedAsset } = useSharedLibrary()

  // 기본 상태
  const [page, setPage] = useState<PageType>('char')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState<string>(MODELS[0].id) // 기본: 나노바나나 (2.5 Flash)
  const [resolution, setResolution] = useState<ImageSize>('1K')
  const [ratio, setRatio] = useState<AspectRatio>('1:1')
  const [genCount, setGenCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  // 다중 선택 상태 (라이브러리에서 Ctrl+클릭으로 여러 이미지 선택)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [previewIndex, setPreviewIndex] = useState<number>(-1) // 현재 미리보기 중인 이미지 (선택된 이미지 중)
  const [libWidth, setLibWidth] = useState(240) // 라이브러리 패널 너비 (리사이즈 가능)
  const [previewZoom, setPreviewZoom] = useState(1) // 미리보기 확대/축소 배율
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 }) // 패닝 오프셋
  const [isPanning, setIsPanning] = useState(false) // 스페이스+드래그 패닝 중
  const [isSpacePressed, setIsSpacePressed] = useState(false) // 스페이스바 눌림 상태
  const [panStart, setPanStart] = useState({ x: 0, y: 0 }) // 패닝 시작 위치
  const [rightPanelTab, setRightPanelTab] = useState<'generate' | 'edit'>('generate') // 우측 패널 탭
  const [isResizing, setIsResizing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false) // 라이브러리 드래그앤드롭 상태

  // 여러장 생성 모드 상태
  const [showGenModal, setShowGenModal] = useState(false)
  const [genMode, setGenMode] = useState<'same' | 'random' | 'sequence' | 'interpolate'>('same')
  const [randomOpts, setRandomOpts] = useState({ pose: true, expr: true, angle: true, cloth: false })
  const [seqCategory, setSeqCategory] = useState<string>('expression')
  // seqValues는 향후 순차 변형 기능에서 사용 예정
  const [_seqValues, _setSeqValues] = useState<string[]>([])
  const [interpSlider, setInterpSlider] = useState<string>('age')
  const [interpStart, setInterpStart] = useState(0)
  const [interpEnd, setInterpEnd] = useState(100)

  // 배치 처리 상태
  const [batchInputs, setBatchInputs] = useState<{ url: string; b64: string }[]>([])
  const [batchResults, setBatchResults] = useState<LibraryImage[]>([])
  const [batchTransform, setBatchTransform] = useState<string>('style')
  const [batchStyle, setBatchStyle] = useState('korean webtoon')
  const [batchPer, setBatchPer] = useState(1)
  const [batchProgress, setBatchProgress] = useState(0)
  const [isBatching, setIsBatching] = useState(false)
  // 일괄 처리 참조 이미지
  const [batchRefImgs, setBatchRefImgs] = useState<RefImage[]>([])

  // 공유 라이브러리 필터
  const [sharedFilter, setSharedFilter] = useState<'all' | 'character' | 'background' | 'batch'>('all')

  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTargetImage, setEditTargetImage] = useState<LibraryImage | null>(null)
  const [editPromptText, setEditPromptText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  // 편집용 참조 이미지 (타입 포함)
  const [editRefImages, setEditRefImages] = useState<RefImage[]>([])
  // 편집 시 유지할 옵션
  const [editPreserveOptions, setEditPreserveOptions] = useState({
    style: true,      // 스타일 유지
    expression: true, // 표정 유지
    pose: false,      // 포즈 유지
    background: false // 배경 유지
  })

  // 편집용 해상도/종횡비/투명배경 설정
  const [editResolution, setEditResolution] = useState<ImageSize>('1K')
  const [editRatio, setEditRatio] = useState<AspectRatio>('1:1')
  const [editTransparent, setEditTransparent] = useState(false)

  // 미리보기 편집 도구 상태
  const [editTool, setEditTool] = useState<'select' | 'lasso' | 'canvas' | 'marker' | 'eyedropper' | 'bucket' | 'pen'>('select')

  // 투명화 처리 상태
  const [transparentProgress, setTransparentProgress] = useState<string | null>(null)

  // 생성 시 투명배경 옵션
  const [generateTransparent, setGenerateTransparent] = useState(false)


  // 생성 중인 이미지 슬롯 (로딩 표시용)
  const [generatingSlots, setGeneratingSlots] = useState<GeneratingSlot[]>([])
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // 해상도 변경 시 모델 자동 변경
  const handleResolutionChange = useCallback((newRes: ImageSize) => {
    setResolution(newRes)
    // 2K/4K 선택 시 고해상도 지원 모델로 자동 변경
    if (newRes === '2K' || newRes === '4K') {
      if (!HIGH_RES_MODELS.includes(model)) {
        setModel('gemini-3-pro-image-preview')
      }
    }
  }, [model])

  // 페이지별 상태
  const [charState, setCharState] = useState<PageState>({
    cat: 'basic',
    values: {},
    negTags: ['low quality', 'blurry', 'bad anatomy', 'extra limbs', 'bad hands', 'multiple characters'],
    refImgs: [],
  })
  const [bgState, setBgState] = useState<PageState>({
    cat: 'style',
    values: {},
    negTags: ['low quality', 'blurry', 'watermark', 'text'],
    refImgs: [],
  })
  const [assetState, setAssetState] = useState<PageState>({
    cat: 'style',
    values: {},
    negTags: ['person', 'human', 'character', 'face', 'hand', 'low quality', 'blurry'],
    refImgs: [],
  })

  // 라이브러리
  const [library, setLibrary] = useState<LibraryImage[]>([])

  // 커스텀 프리셋
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('ai-studio-custom-presets')
    return saved ? JSON.parse(saved) : []
  })
  const [presetName, setPresetName] = useState('')
  const [showPresetModal, setShowPresetModal] = useState(false)

  // 글로벌 컬러 슬라이더 상태 (색상/채도/명도)
  const [globalHue, setGlobalHue] = useState(0)
  const [globalSat, setGlobalSat] = useState(70)
  const [globalLight, setGlobalLight] = useState(50)

  // 색상 팔레트 (40칸 고정: 10x4, null은 빈칸)
  const [colorPalette, setColorPalette] = useState<Array<{h: number, s: number, l: number} | null>>(() => {
    const saved = localStorage.getItem('ai-studio-color-palette')
    const parsed = saved ? JSON.parse(saved) : []
    // 40칸 고정 (부족하면 null로 채움)
    const palette = new Array(40).fill(null)
    parsed.forEach((c: {h: number, s: number, l: number} | null, i: number) => {
      if (i < 40) palette[i] = c
    })
    return palette
  })
  // 선택된 팔레트 슬롯 인덱스 (버킷으로 채울 때 사용)
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null)

  // 현재 페이지 상태
  const currentState = page === 'char' ? charState : page === 'bg' ? bgState : assetState
  const setCurrentState = page === 'char' ? setCharState : page === 'bg' ? setBgState : setAssetState
  const categories = page === 'char' ? CHAR_CATEGORIES : page === 'bg' ? BG_CATEGORIES : ASSET_CATEGORIES
  const presets = page === 'char' ? CHAR_PRESETS : page === 'bg' ? BG_PRESETS : ASSET_PRESETS

  // 카테고리 선택
  const selectCategory = useCallback(
    (cat: string) => {
      setCurrentState((prev) => ({ ...prev, cat }))
    },
    [setCurrentState]
  )

  // 태그 토글
  const toggleTag = useCallback(
    (key: string, value: string, isNeg: boolean) => {
      setCurrentState((prev) => {
        if (isNeg) {
          const negTags = prev.negTags.includes(value) ? prev.negTags.filter((t) => t !== value) : [...prev.negTags, value]
          return { ...prev, negTags }
        } else {
          const current = prev.values[key]
          let newVal: string[]
          if (Array.isArray(current)) {
            newVal = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
          } else {
            newVal = [value]
          }
          return { ...prev, values: { ...prev.values, [key]: newVal.length > 0 ? newVal : undefined } }
        }
      })
    },
    [setCurrentState]
  )

  // 슬라이더 값 변경
  const updateSlider = useCallback(
    (key: string, value: number) => {
      setCurrentState((prev) => ({
        ...prev,
        values: { ...prev.values, [key]: value },
      }))
    },
    [setCurrentState]
  )

  // 색상 값 변경
  const updateColor = useCallback(
    (key: string, type: 'h' | 'l', value: number) => {
      setCurrentState((prev) => {
        const current = (prev.values[key] as { h: number; l: number }) || { h: 30, l: 50 }
        return {
          ...prev,
          values: { ...prev.values, [key]: { ...current, [type]: value } },
        }
      })
    },
    [setCurrentState]
  )

  // 버킷으로 색칠 (현재 선택된 글로벌 색상을 해당 키에 적용)
  const applyBucket = useCallback((key: string) => {
    setCurrentState((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: { h: globalHue, s: globalSat, l: globalLight } },
    }))
    // 팔레트에 색상 추가 (중복 제거, 최대 40개)
    setColorPalette(prev => {
      const exists = prev.some(c => c && c.h === globalHue && c.s === globalSat && c.l === globalLight)
      if (exists) return prev
      const newPalette = [{ h: globalHue, s: globalSat, l: globalLight }, ...prev].slice(0, 40)
      localStorage.setItem('ai-studio-color-palette', JSON.stringify(newPalette))
      return newPalette
    })
  }, [globalHue, globalSat, globalLight, setCurrentState])

  // 값 초기화
  const clearValue = useCallback(
    (key: string, isNeg?: boolean) => {
      setCurrentState((prev) => {
        if (isNeg) {
          return { ...prev, negTags: [] }
        }
        const newValues = { ...prev.values }
        delete newValues[key]
        delete newValues[key + 'Color']
        delete newValues[key + 'Str']
        return { ...prev, values: newValues }
      })
    },
    [setCurrentState]
  )

  // 프리셋 적용
  const applyPreset = useCallback(
    (preset: Preset) => {
      setCurrentState((prev) => ({
        ...prev,
        values: { ...preset.data },
      }))
    },
    [setCurrentState]
  )

  // 전체 초기화
  const resetAll = useCallback(() => {
    setCurrentState((prev) => ({
      ...prev,
      values: {},
    }))
  }, [setCurrentState])

  // 커스텀 프리셋 저장
  const saveCustomPreset = useCallback(() => {
    if (!presetName.trim()) {
      alert('프리셋 이름을 입력하세요')
      return
    }
    const newPreset: Preset = {
      name: presetName.trim(),
      icon: page === 'char' ? '👤' : '🏙️',
      data: { ...currentState.values },
    }
    const updated = [...customPresets, newPreset]
    setCustomPresets(updated)
    localStorage.setItem('ai-studio-custom-presets', JSON.stringify(updated))
    setPresetName('')
    setShowPresetModal(false)
    alert(`"${presetName}" 프리셋이 저장되었습니다`)
  }, [presetName, page, currentState.values, customPresets])

  // 커스텀 프리셋 삭제
  const deleteCustomPreset = useCallback((index: number) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return
    const updated = customPresets.filter((_, i) => i !== index)
    setCustomPresets(updated)
    localStorage.setItem('ai-studio-custom-presets', JSON.stringify(updated))
  }, [customPresets])

  // 참조 이미지 추가
  const handleRefImageUpload = useCallback(
    async (files: FileList) => {
      const newImgs: RefImage[] = []
      for (const file of Array.from(files)) {
        if (currentState.refImgs.length + newImgs.length >= 14) break
        const url = URL.createObjectURL(file)
        const b64 = await fileToBase64(file)
        newImgs.push({ url, b64, type: 'style', strength: 0.8 })
      }
      setCurrentState((prev) => ({
        ...prev,
        refImgs: [...prev.refImgs, ...newImgs],
      }))
    },
    [currentState.refImgs.length, setCurrentState]
  )

  // 참조 이미지 삭제
  const removeRefImage = useCallback(
    (index: number) => {
      setCurrentState((prev) => ({
        ...prev,
        refImgs: prev.refImgs.filter((_, i) => i !== index),
      }))
    },
    [setCurrentState]
  )

  // 참조 이미지 유형 변경
  const updateRefType = useCallback(
    (index: number, type: string) => {
      setCurrentState((prev) => ({
        ...prev,
        refImgs: prev.refImgs.map((img, i) => (i === index ? { ...img, type } : img)),
      }))
    },
    [setCurrentState]
  )

  // 참조 이미지 강도 변경
  const updateRefStrength = useCallback(
    (index: number, strength: number) => {
      setCurrentState((prev) => ({
        ...prev,
        refImgs: prev.refImgs.map((img, i) => (i === index ? { ...img, strength } : img)),
      }))
    },
    [setCurrentState]
  )

  // 프롬프트 생성
  const prompt = useMemo(() => {
    const parts: string[] = []

    Object.values(categories).forEach((cat: Category) => {
      Object.entries(cat.items).forEach(([key, item]) => {
        if ('isNeg' in item && item.isNeg) return
        const val = currentState.values[key]
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) return

        let promptText = ''
        if ('type' in item && item.type) {
          const sliderItem = item as SliderItem
          if (sliderItem.type === 'hue' || sliderItem.type === 'skin') {
            const colorVal = val as { h: number; s?: number; l: number }
            // s(채도) 값도 전달 (기본값 70)
            promptText = sliderItem.prompt(colorVal.h, colorVal.s ?? 70, colorVal.l)
          } else {
            promptText = sliderItem.prompt(val as number)
          }
        } else if ('tags' in item) {
          const tagItem = item as TagItem
          const vals = Array.isArray(val) ? val : [val]
          const validVals = (vals as string[]).filter((v) => v && v !== 'none' && !v.startsWith('no ') && !v.startsWith('empty'))
          if (validVals.length === 0) return

          if (tagItem.hasColor && currentState.values[key + 'Color']) {
            const c = currentState.values[key + 'Color'] as { h: number; s: number; l: number }
            promptText = validVals.map((v) => getColorPrompt(c.h, c.s ?? 70, c.l) + ' colored ' + v).join(', ')
          } else {
            promptText = validVals.join(', ')
          }
        }

        if (promptText) {
          const str = (currentState.values[key + 'Str'] as number) ?? 1
          parts.push(str !== 1 ? `(${promptText}:${str})` : promptText)
        }
      })
    })

    let base = parts.join(', ')
    if (page === 'char') {
      base = `A single character, full body, pure white background, ${base}. Only ONE character.`
    } else if (page === 'asset') {
      base = `A single item, product shot, centered, ${base}. Only ONE object, no person, no character.`
    }
    return base
  }, [categories, currentState.values, page])

  // 네거티브 프롬프트
  const negPrompt = useMemo(() => currentState.negTags.join(', '), [currentState.negTags])

  // 필터링된 공유 라이브러리
  const filteredSharedAssets = useMemo(() => {
    if (sharedFilter === 'all') return sharedAssets
    return sharedAssets.filter(asset => asset.category === sharedFilter)
  }, [sharedAssets, sharedFilter])

  // 단일 이미지 생성 함수 (내부용)
  const generateSingleImage = useCallback(async (fullPrompt: string, index: number): Promise<LibraryImage> => {
    let result: { base64: string; url: string }

    if (currentState.refImgs.length > 0) {
      // 참조 이미지가 있으면 editImage 사용
      const refB64s = currentState.refImgs.map((img) => img.b64)
      result = await editImage(apiKey, refB64s[0], fullPrompt, model, 'image/png', refB64s.slice(1), {
        imageSize: resolution,
        aspectRatio: ratio,
      })
    } else {
      // 참조 이미지가 없으면 generateImage 사용
      const provider = getModelProvider(model)
      if (provider === 'modelscope') {
        // ModelScope Z-Image-Turbo
        result = await generateImageModelScope(apiKey, fullPrompt, {
          aspectRatio: ratio,
        })
      } else {
        // Gemini 모델
        result = await generateImage(apiKey, fullPrompt, model, {
          imageSize: resolution,
          aspectRatio: ratio,
        })
      }
    }

    // 투명배경 옵션이 켜져있으면 투명화 처리
    if (generateTransparent) {
      setTransparentProgress(`이미지 ${index + 1} 투명화 처리 중...`)
      const transparentUrl = await createTransparentImage(
        apiKey,
        result.base64,
        model,
        (step) => setTransparentProgress(`이미지 ${index + 1}: ${step}`)
      )
      const b64 = transparentUrl.split(',')[1]
      return { url: transparentUrl, b64, prompt: `[투명배경] ${fullPrompt}` }
    }

    return { url: result.url, b64: result.base64, prompt: fullPrompt }
  }, [apiKey, currentState.refImgs, model, resolution, ratio, generateTransparent])

  // 생성 취소
  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort()
    }
    setGeneratingSlots([])
    setIsGenerating(false)
    setTransparentProgress(null)
    setAbortController(null)
  }, [abortController])

  // 개별 슬롯 취소
  const cancelSlot = useCallback((slotId: string) => {
    setGeneratingSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, status: 'cancelled' as const } : s
    ))
  }, [])

  // 이미지 생성
  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      alert('API 키를 입력하세요')
      return
    }

    // 투명배경 경고
    if (generateTransparent) {
      const confirmed = window.confirm(
        '⚠️ 투명배경 생성 안내\n\n' +
        '• 흰배경 이미지 생성 후 검정배경으로 변환하여 알파 채널을 추출합니다.\n' +
        '• 일반 생성보다 2배의 API 호출이 필요합니다.\n' +
        '• 처리 시간이 더 오래 걸립니다.\n\n' +
        '계속하시겠습니까?'
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    const controller = new AbortController()
    setAbortController(controller)

    // 로딩 슬롯 생성
    const slots: GeneratingSlot[] = Array.from({ length: genCount }, (_, i) => ({
      id: `gen-${Date.now()}-${i}`,
      index: i,
      status: 'generating' as const
    }))
    setGeneratingSlots(slots)

    try {
      // 프롬프트 구성
      let fullPrompt = prompt
      if (currentState.refImgs.length > 0) {
        const refPrompts = buildRefPrompts(currentState.refImgs)
        fullPrompt += '\n\n' + refPrompts
      }
      if (currentState.negTags.length > 0) {
        fullPrompt += `\n\nAvoid: ${negPrompt}`
      }

      // 슬롯 진행 상태 업데이트 함수
      const updateSlotProgress = (slotId: string, progress: string, status?: GeneratingSlot['status']) => {
        setGeneratingSlots(prev => prev.map(s =>
          s.id === slotId ? { ...s, progress, ...(status ? { status } : {}) } : s
        ))
      }

      // 각 슬롯별로 생성
      const generateForSlot = async (slot: GeneratingSlot): Promise<{ slotId: string; result: LibraryImage | null; failed: boolean }> => {
        // 취소된 슬롯은 스킵
        const currentSlot = generatingSlots.find(s => s.id === slot.id)
        if (currentSlot?.status === 'cancelled') {
          return { slotId: slot.id, result: null, failed: false }
        }

        try {
          updateSlotProgress(slot.id, 'API 호출 중...')

          let result: { base64: string; url: string }

          if (currentState.refImgs.length > 0) {
            updateSlotProgress(slot.id, '참조 이미지 처리 중...')
            const refB64s = currentState.refImgs.map((img) => img.b64)
            result = await editImage(apiKey, refB64s[0], fullPrompt, model, 'image/png', refB64s.slice(1), {
              imageSize: resolution,
              aspectRatio: ratio,
            })
          } else {
            updateSlotProgress(slot.id, '이미지 생성 중...')
            const provider = getModelProvider(model)
            if (provider === 'modelscope') {
              result = await generateImageModelScope(apiKey, fullPrompt, {
                aspectRatio: ratio,
              })
            } else {
              result = await generateImage(apiKey, fullPrompt, model, {
                imageSize: resolution,
                aspectRatio: ratio,
              })
            }
          }

          updateSlotProgress(slot.id, '이미지 수신 완료')

          // 투명배경 옵션이 켜져있으면 투명화 처리
          if (generateTransparent) {
            updateSlotProgress(slot.id, '투명화 준비...', 'transparent')
            const transparentUrl = await createTransparentImage(
              apiKey,
              result.base64,
              model,
              (step) => updateSlotProgress(slot.id, step, 'transparent')
            )
            const b64 = transparentUrl.split(',')[1]
            return { slotId: slot.id, result: { url: transparentUrl, b64, prompt: `[투명배경] ${fullPrompt}` }, failed: false }
          }

          return { slotId: slot.id, result: { url: result.url, b64: result.base64, prompt: fullPrompt }, failed: false }
        } catch (err) {
          // 에러 시 슬롯을 실패 상태로 변경 (제거하지 않음)
          const errorMsg = err instanceof Error ? err.message : '생성 실패'
          setGeneratingSlots(prev => prev.map(s =>
            s.id === slot.id ? { ...s, status: 'failed' as const, error: errorMsg, progress: '실패' } : s
          ))
          return { slotId: slot.id, result: null, failed: true }
        }
      }

      // 병렬 처리
      const promises = slots.map(slot => generateForSlot(slot))
      const results = await Promise.all(promises)

      // 성공한 결과만 라이브러리에 추가 (슬롯도 제거)
      const successResults = results
        .filter(r => r.result !== null && !r.failed)
        .map(r => r.result as LibraryImage)
        .reverse()

      // 성공한 슬롯 제거
      const successSlotIds = results.filter(r => r.result !== null && !r.failed).map(r => r.slotId)
      setGeneratingSlots(prev => prev.filter(s => !successSlotIds.includes(s.id)))

      if (successResults.length > 0) {
        setLibrary((prev) => [...successResults, ...prev])
        successResults.forEach(img => {
          onImageGenerated?.(img.url, img.prompt || '')
          // 공유 라이브러리에도 추가
          addSharedAsset({
            url: img.url,
            prompt: img.prompt,
            category: page === 'char' ? 'character' : 'background',
            source: 'whiteboard',
          })
        })
      }

      // 실패한 슬롯이 있으면 알림
      const failedCount = results.filter(r => r.failed).length
      if (failedCount > 0) {
        console.log(`${failedCount}개 이미지 생성 실패`)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('생성이 취소되었습니다')
      } else {
        console.error('생성 오류:', err)
        alert(err instanceof Error ? err.message : '생성 실패')
      }
    } finally {
      setIsGenerating(false)
      setTransparentProgress(null)
      // 실패한 슬롯은 유지 (사용자가 확인할 수 있도록)
      setGeneratingSlots(prev => prev.filter(s => s.status === 'failed'))
      setAbortController(null)
    }
  }, [apiKey, genCount, prompt, currentState.refImgs, currentState.negTags, negPrompt, generateSingleImage, generateTransparent, onImageGenerated, generatingSlots])

  // 라이브러리 이미지 다운로드
  const downloadImage = useCallback((img: LibraryImage, index: number) => {
    const a = document.createElement('a')
    a.href = img.url
    a.download = `image_${Date.now()}_${index}.png`
    a.click()
  }, [])

  // 라이브러리 초기화
  const clearLibrary = useCallback(() => {
    if (!confirm('라이브러리의 모든 이미지를 삭제하시겠습니까?')) return
    setLibrary([])
  }, [])

  // 이미지 선택 (Ctrl+클릭으로 다중 선택, 일반 클릭은 단일 선택)
  const handleImageClick = useCallback((index: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+클릭: 다중 선택 토글
      setSelectedIndices(prev => {
        if (prev.includes(index)) {
          const newIndices = prev.filter(i => i !== index)
          // 미리보기 인덱스 조정
          if (previewIndex === index) {
            setPreviewIndex(newIndices.length > 0 ? newIndices[0] : -1)
          }
          return newIndices
        } else {
          return [...prev, index].sort((a, b) => a - b)
        }
      })
    } else if (e.shiftKey && selectedIndices.length > 0) {
      // Shift+클릭: 범위 선택
      const lastSelected = selectedIndices[selectedIndices.length - 1]
      const start = Math.min(lastSelected, index)
      const end = Math.max(lastSelected, index)
      const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
      setSelectedIndices(prev => [...new Set([...prev, ...range])].sort((a, b) => a - b))
      setPreviewIndex(index)
    } else {
      // 일반 클릭: 단일 선택
      setSelectedIndices([index])
      setPreviewIndex(index)
    }
  }, [selectedIndices, previewIndex])

  // 전체 선택 해제
  const deselectAll = useCallback(() => {
    setSelectedIndices([])
    setPreviewIndex(-1)
  }, [])

  // 전체 선택
  const selectAll = useCallback(() => {
    setSelectedIndices(library.map((_, i) => i))
    setPreviewIndex(0)
  }, [library])

  // 미리보기에서 이전/다음 이미지 (선택된 이미지들 중에서)
  const goToPrevSelected = useCallback(() => {
    if (selectedIndices.length === 0) return
    const currentPos = selectedIndices.indexOf(previewIndex)
    if (currentPos > 0) {
      setPreviewIndex(selectedIndices[currentPos - 1])
    }
  }, [selectedIndices, previewIndex])

  const goToNextSelected = useCallback(() => {
    if (selectedIndices.length === 0) return
    const currentPos = selectedIndices.indexOf(previewIndex)
    if (currentPos < selectedIndices.length - 1) {
      setPreviewIndex(selectedIndices[currentPos + 1])
    }
  }, [selectedIndices, previewIndex])

  // 현재 미리보기 이미지
  const currentPreviewImage = previewIndex >= 0 ? library[previewIndex] : null
  // 선택된 이미지들
  const selectedImages = selectedIndices.map(i => library[i]).filter(Boolean)

  // 선택된 이미지들 삭제 (handlePreviewKeyDown에서 사용하므로 먼저 정의)
  const deleteSelectedImages = useCallback(() => {
    if (selectedIndices.length === 0) return
    if (!confirm(`선택한 ${selectedIndices.length}개 이미지를 삭제하시겠습니까?`)) return
    setLibrary(prev => prev.filter((_, i) => !selectedIndices.includes(i)))
    setSelectedIndices([])
    setPreviewIndex(-1)
  }, [selectedIndices])

  // 키보드 네비게이션 (상하 화살표)
  const handlePreviewKeyDown = useCallback((e: KeyboardEvent) => {
    // textarea나 input에서는 무시
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
    if (library.length === 0) return

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      // 현재 선택 위치에서 위로 이동 (이전 이미지)
      const currentIdx = previewIndex >= 0 ? previewIndex : 0
      const newIdx = currentIdx > 0 ? currentIdx - 1 : library.length - 1
      setSelectedIndices([newIdx])
      setPreviewIndex(newIdx)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // 현재 선택 위치에서 아래로 이동 (다음 이미지)
      const currentIdx = previewIndex >= 0 ? previewIndex : -1
      const newIdx = currentIdx < library.length - 1 ? currentIdx + 1 : 0
      setSelectedIndices([newIdx])
      setPreviewIndex(newIdx)
    } else if (e.key === 'Escape') {
      deselectAll()
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      selectAll()
    } else if (e.key === 'Delete' && selectedIndices.length > 0) {
      deleteSelectedImages()
    }
  }, [selectedIndices, previewIndex, library, deselectAll, selectAll, deleteSelectedImages])

  // 키보드 이벤트 등록
  useEffect(() => {
    window.addEventListener('keydown', handlePreviewKeyDown)
    return () => window.removeEventListener('keydown', handlePreviewKeyDown)
  }, [handlePreviewKeyDown])

  // 스페이스바 패닝 모드 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 이미지 선택 변경 시 확대/패닝 초기화
  useEffect(() => {
    setPreviewZoom(1)
    setPreviewPan({ x: 0, y: 0 })
  }, [previewIndex])

  // 라이브러리 이미지 삭제 (확인 포함)
  const deleteLibraryImage = useCallback((index: number) => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return
    setLibrary((prev) => prev.filter((_, i) => i !== index))
    // 선택된 인덱스들 조정
    setSelectedIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i))
    if (previewIndex === index) {
      setPreviewIndex(-1)
    } else if (previewIndex > index) {
      setPreviewIndex(prev => prev - 1)
    }
  }, [previewIndex])

  // 라이브러리 패널 리사이즈 핸들러 (수평)
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = libWidth

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const newWidth = Math.min(Math.max(startWidth + delta, 180), 400) // 최소 180, 최대 400
      setLibWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [libWidth])

  // 라이브러리에 이미지 업로드 (버튼 클릭)
  const handleLibraryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: LibraryImage[] = []
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const b64 = await fileToBase64(file)
      newImages.push({ url, b64, prompt: `[업로드] ${file.name}` })
    }
    setLibrary((prev) => [...newImages, ...prev])
    e.target.value = ''
  }, [])

  // 라이브러리 드래그앤드롭 핸들러
  const handleLibraryDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const files = e.dataTransfer.files
    if (!files.length) return

    const newImages: LibraryImage[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const url = URL.createObjectURL(file)
      const b64 = await fileToBase64(file)
      newImages.push({ url, b64, prompt: `[업로드] ${file.name}` })
    }
    if (newImages.length > 0) {
      setLibrary((prev) => [...newImages, ...prev])
    }
  }, [])

  const handleLibraryDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }, [])

  const handleLibraryDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 자식 요소로 이동하는 경우 무시 (깜빡임 방지)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return // 여전히 영역 내부에 있으면 무시
    }
    setIsDraggingOver(false)
  }, [])

  // 배치 파일 업로드
  const handleBatchFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newInputs: { url: string; b64: string }[] = []
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const b64 = await fileToBase64(file)
      newInputs.push({ url, b64 })
    }
    setBatchInputs((prev) => [...prev, ...newInputs])
    e.target.value = '' // 같은 파일 재업로드 허용
  }, [])

  // 일괄 처리 참조 이미지 업로드
  const handleBatchRefUpload = useCallback(async (files: FileList) => {
    const newImgs: RefImage[] = []
    for (const file of Array.from(files)) {
      if (batchRefImgs.length + newImgs.length >= 14) break
      const url = URL.createObjectURL(file)
      const b64 = await fileToBase64(file)
      newImgs.push({ url, b64, type: 'style', strength: 0.8 })
    }
    setBatchRefImgs((prev) => [...prev, ...newImgs])
  }, [batchRefImgs.length])

  // 일괄 처리 참조 이미지 삭제
  const removeBatchRefImage = useCallback((index: number) => {
    setBatchRefImgs((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // 일괄 처리 참조 이미지 유형 변경
  const updateBatchRefType = useCallback((index: number, type: string) => {
    setBatchRefImgs((prev) => prev.map((img, i) => (i === index ? { ...img, type } : img)))
  }, [])

  // 일괄 처리 참조 이미지 강도 변경
  const updateBatchRefStrength = useCallback((index: number, strength: number) => {
    setBatchRefImgs((prev) => prev.map((img, i) => (i === index ? { ...img, strength } : img)))
  }, [])

  // 배치 처리 시작 (병렬 처리)
  const startBatch = useCallback(async () => {
    if (!apiKey || batchInputs.length === 0) {
      alert('API 키와 변환할 이미지를 추가하세요')
      return
    }

    setIsBatching(true)
    setBatchProgress(0)
    setBatchResults([])

    // 변환 프롬프트 구성
    const transformPrompts: Record<string, string> = {
      style: `Convert this image to ${batchStyle} art style. Keep the composition and subject the same.`,
      full: `Completely redraw this image in ${batchStyle} style. Reimagine all elements.`,
      color: `Adjust the color palette of this image to match ${batchStyle} aesthetic. Keep everything else the same.`,
      pose: `Change the pose of the character in this image to a different pose. Keep the same character, style, and background. Use reference images for the new pose if provided.`,
      angle: `Change the camera angle/view of this image. Keep the same subject and style but show it from a different perspective. Use reference images if provided.`,
      expression: `Change the facial expression of the character in this image. Keep everything else the same - same pose, clothes, background.`,
      lineart: `Extract clean line art from this image. Black lines on white background, no colors.`,
      sketch: `Convert this image to a pencil sketch style. Grayscale, hand-drawn look.`,
      enhance: `Enhance this image with better quality, sharper details, and improved lighting.`,
      upscale: `Upscale and enhance this image while preserving all details.`,
      removebg: `Remove the background and make it pure white. Keep the main subject intact.`,
      nightify: `Convert this daytime scene to a nighttime scene. Add moonlight and stars.`,
      dayify: `Convert this nighttime scene to a daytime scene. Add sunlight and blue sky.`,
    }

    let batchPrompt = transformPrompts[batchTransform] || transformPrompts.style

    // 참조 이미지가 있으면 프롬프트에 추가 (왼쪽 사이드바 참조 사용)
    if (currentState.refImgs.length > 0) {
      const refPrompts = buildRefPrompts(currentState.refImgs)
      batchPrompt += '\n\n' + refPrompts
    }

    // 모든 작업을 배열로 구성
    const tasks: { input: { url: string; b64: string }; idx: number }[] = []
    batchInputs.forEach((input, inputIdx) => {
      for (let i = 0; i < batchPer; i++) {
        tasks.push({ input, idx: inputIdx * batchPer + i })
      }
    })

    const total = tasks.length
    let completed = 0

    try {
      // 병렬 처리 (모든 작업을 동시에)
      const promises = tasks.map(async ({ input }) => {
        // 참조 이미지 b64 수집 (왼쪽 사이드바 참조 사용)
        const refB64s = currentState.refImgs.map((img) => img.b64)

        const result = await editImage(
          apiKey,
          input.b64,
          batchPrompt,
          model,
          'image/png',
          refB64s.length > 0 ? refB64s : undefined,
          {
            imageSize: resolution,
            aspectRatio: ratio,
          }
        )

        completed++
        setBatchProgress((completed / total) * 100)

        return { url: result.url, b64: result.base64, prompt: batchPrompt } as LibraryImage
      })

      const results = await Promise.all(promises)
      setBatchResults(results)
      // 공유 라이브러리에도 추가
      results.forEach(img => {
        addSharedAsset({
          url: img.url,
          prompt: img.prompt,
          category: 'batch',
          source: 'whiteboard',
        })
      })
    } catch (err) {
      console.error('배치 오류:', err)
      alert(err instanceof Error ? err.message : '배치 처리 실패')
    } finally {
      setIsBatching(false)
    }
  }, [apiKey, batchInputs, batchPer, batchTransform, batchStyle, batchRefImgs, model, resolution, ratio, addSharedAsset])

  // 편집 모달 열기
  const openEditModal = useCallback((img: LibraryImage) => {
    setEditTargetImage(img)
    setEditPromptText('')
    setShowEditModal(true)
  }, [])

  // AI 편집 적용
  const applyAIEdit = useCallback(async () => {
    if (!apiKey || !editTargetImage || !editPromptText.trim()) {
      alert('API 키와 편집 프롬프트를 입력하세요')
      return
    }

    setIsEditing(true)

    try {
      const result = await editImage(apiKey, editTargetImage.b64, editPromptText, model, 'image/png', undefined, {
        imageSize: resolution,
        aspectRatio: ratio,
      })

      // 편집된 이미지로 업데이트
      setEditTargetImage({ url: result.url, b64: result.base64, prompt: editPromptText })
    } catch (err) {
      console.error('편집 오류:', err)
      alert(err instanceof Error ? err.message : '편집 실패')
    } finally {
      setIsEditing(false)
    }
  }, [apiKey, editTargetImage, editPromptText, model, resolution, ratio])

  // 편집된 이미지 라이브러리에 추가
  const saveEditedImage = useCallback(() => {
    if (editTargetImage) {
      setLibrary((prev) => [editTargetImage, ...prev])
      setShowEditModal(false)
    }
  }, [editTargetImage])

  // 투명 배경 생성 (라이브러리 이미지용)
  const makeTransparent = useCallback(async (img: LibraryImage, index: number) => {
    if (!apiKey) {
      alert('API 키를 입력하세요')
      return
    }

    setTransparentProgress(`이미지 ${index + 1} 투명화 처리 중...`)

    try {
      const transparentUrl = await createTransparentImage(
        apiKey,
        img.b64,
        model,
        (step) => setTransparentProgress(`이미지 ${index + 1}: ${step}`)
      )

      // base64 추출
      const b64 = transparentUrl.split(',')[1]
      const newImg: LibraryImage = { url: transparentUrl, b64, prompt: `[투명배경] ${img.prompt || ''}` }
      setLibrary((prev) => [newImg, ...prev])
      onImageGenerated?.(transparentUrl, newImg.prompt || '')
    } catch (err) {
      console.error('투명화 오류:', err)
      alert(err instanceof Error ? err.message : '투명화 실패')
    } finally {
      setTransparentProgress(null)
    }
  }, [apiKey, model, onImageGenerated])

  // 투명 배경 생성 (편집 모달용)
  const makeEditTransparent = useCallback(async () => {
    if (!apiKey || !editTargetImage) {
      alert('API 키를 입력하세요')
      return
    }

    setIsEditing(true)
    setTransparentProgress('투명화 처리 중...')

    try {
      const transparentUrl = await createTransparentImage(
        apiKey,
        editTargetImage.b64,
        model,
        (step) => setTransparentProgress(step)
      )

      // base64 추출
      const b64 = transparentUrl.split(',')[1]
      setEditTargetImage({ url: transparentUrl, b64, prompt: `[투명배경] ${editTargetImage.prompt || ''}` })
    } catch (err) {
      console.error('투명화 오류:', err)
      alert(err instanceof Error ? err.message : '투명화 실패')
    } finally {
      setIsEditing(false)
      setTransparentProgress(null)
    }
  }, [apiKey, editTargetImage, model])

  // 값 표시 텍스트
  const getDisplayValue = (item: TagItem | SliderItem, val: unknown): string => {
    if (!val || (Array.isArray(val) && val.length === 0)) return ''
    if ('type' in item && item.type === 'slider') {
      const sliderItem = item as SliderItem
      return `${val}${sliderItem.unit || ''}`
    }
    if ('type' in item && (item.type === 'hue' || item.type === 'skin')) {
      const colorVal = val as { h: number; l: number }
      return getColorNameKo(colorVal.h, colorVal.l)
    }
    if ('tags' in item) {
      const tagItem = item as TagItem
      const vals = Array.isArray(val) ? val : [val]
      const display = (vals as string[])
        .slice(0, 2)
        .map((v) => tagItem.tags.find((t) => t[0] === v)?.[1] || v)
        .join(', ')
      return (vals as string[]).length > 2 ? display + '...' : display
    }
    return String(val)
  }

  // 카테고리에 값이 있는지 확인
  const hasValue = (catKey: string): boolean => {
    const cat = categories[catKey]
    return Object.keys(cat.items).some((itemKey) => {
      const val = currentState.values[itemKey]
      return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)
    })
  }

  return (
    <div className="ai-studio">
      {/* 상단바 - 생성 설정 포함 */}
      <header className="studio-header">
        <button className="nav-btn back-btn" onClick={() => navigate('/workspace')}>
          ← 워크스페이스
        </button>
        <div className="logo">🎨 AI 스튜디오</div>
        <div className="header-controls">
          <input type="password" className="inp api-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="🔑 API Key" />
          <select className="sel model-select" value={model} onChange={(e) => setModel(e.target.value)} title="AI 모델">
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} title={`${m.desc} | ${m.price}`}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 메인 */}
      <div className="studio-main">
        {/* 좌측 패널 - 페이지 탭 */}
        <div className="left-panel">
          <div className="page-tabs">
            <button className={`page-tab ${page === 'char' ? 'active' : ''}`} onClick={() => setPage('char')}>
              👤 캐릭터
            </button>
            <button className={`page-tab ${page === 'bg' ? 'active' : ''}`} onClick={() => setPage('bg')}>
              🏙️ 배경
            </button>
            <button className={`page-tab ${page === 'asset' ? 'active' : ''}`} onClick={() => setPage('asset')}>
              📦 어셋
            </button>
          </div>
          {/* 캐릭터/배경 페이지에서 카테고리와 설정 표시 */}
          <>
              {/* 초기화 버튼 */}
              <div className="left-panel-actions">
                <button className="btn-reset" onClick={resetAll} title="모든 설정 초기화">
                  🔄 초기화
                </button>
              </div>
              <div className="cat-bar">
                {Object.entries(categories).map(([key, cat]) => (
                  <button key={key} className={`cat-btn ${currentState.cat === key ? 'active' : ''} ${hasValue(key) ? 'has-val' : ''}`} onClick={() => selectCategory(key)}>
                    <span className="dot" />
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              <div className="settings">
                {renderSettings()}
              </div>

              {/* 프리셋 섹션 (좌측에 배치) */}
              <div className="panel-section preset-section-left">
                <div className="panel-title">
                  <span>📚</span> 프리셋
                  <button className="btn-add-preset-sm" onClick={() => setShowPresetModal(true)}>+ 저장</button>
                </div>
                <div className="preset-grid-left">
                  {customPresets.map((preset, i) => (
                    <div key={`c-${i}`} className="preset-chip custom" onClick={() => applyPreset(preset)}>
                      <span>{preset.name}</span>
                      <button className="preset-del" onClick={(e) => { e.stopPropagation(); deleteCustomPreset(i) }}>×</button>
                    </div>
                  ))}
                  {presets.map((preset, i) => (
                    <div key={i} className="preset-chip" onClick={() => applyPreset(preset)}>
                      {preset.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* 컬러 슬라이더 섹션 */}
              <div className="panel-section color-picker-section">
                <div className="panel-title"><span>🎨</span> 색상 선택</div>

                {/* 색상 미리보기 */}
                <div className="color-preview-box" style={{ background: hslToHex(globalHue, globalSat, globalLight) }}>
                  <span className="color-hex-label">{hslToHex(globalHue, globalSat, globalLight)}</span>
                </div>

                {/* 색상(Hue) 슬라이더 */}
                <div className="color-slider-row">
                  <span className="color-slider-label">색상</span>
                  <div className="color-slider-track hue-track">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={globalHue}
                      onChange={(e) => setGlobalHue(Number(e.target.value))}
                    />
                  </div>
                  <span className="color-slider-value">{globalHue}°</span>
                </div>

                {/* 채도(Saturation) 슬라이더 */}
                <div className="color-slider-row">
                  <span className="color-slider-label">채도</span>
                  <div className="color-slider-track sat-track" style={{ '--hue': globalHue, '--light': globalLight } as React.CSSProperties}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={globalSat}
                      onChange={(e) => setGlobalSat(Number(e.target.value))}
                    />
                  </div>
                  <span className="color-slider-value">{globalSat}%</span>
                </div>

                {/* 명도(Lightness) 슬라이더 */}
                <div className="color-slider-row">
                  <span className="color-slider-label">명도</span>
                  <div className="color-slider-track light-track" style={{ '--hue': globalHue, '--sat': globalSat } as React.CSSProperties}>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={globalLight}
                      onChange={(e) => setGlobalLight(Number(e.target.value))}
                    />
                  </div>
                  <span className="color-slider-value">{globalLight}%</span>
                </div>

                {/* 색상 팔레트 (16칸 고정) */}
                <div className="mini-palette">
                  <div className="mini-palette-header">
                    <span className="mini-palette-label">팔레트</span>
                    <button
                      className={`btn-bucket ${selectedPaletteIndex !== null ? 'active' : ''}`}
                      onClick={() => {
                        if (selectedPaletteIndex !== null) {
                          // 버킷 클릭: 선택된 슬롯에 현재 색상 채우기
                          setColorPalette(prev => {
                            const newPalette = [...prev]
                            newPalette[selectedPaletteIndex] = { h: globalHue, s: globalSat, l: globalLight }
                            localStorage.setItem('ai-studio-color-palette', JSON.stringify(newPalette))
                            return newPalette
                          })
                          setSelectedPaletteIndex(null)
                        }
                      }}
                      disabled={selectedPaletteIndex === null}
                      title="선택된 칸에 현재 색상 채우기"
                    >
                      🪣
                    </button>
                    <button
                      className="btn-clear-palette"
                      onClick={() => {
                        setColorPalette(new Array(40).fill(null))
                        localStorage.setItem('ai-studio-color-palette', JSON.stringify(new Array(40).fill(null)))
                        setSelectedPaletteIndex(null)
                      }}
                      title="팔레트 초기화"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mini-palette-grid-40">
                    {colorPalette.map((c, i) => (
                      <button
                        key={i}
                        className={`mini-palette-slot ${c ? 'filled' : 'empty'} ${selectedPaletteIndex === i ? 'slot-selected' : ''} ${c && globalHue === c.h && globalSat === c.s && globalLight === c.l ? 'color-active' : ''}`}
                        style={c ? { background: hslToHex(c.h, c.s, c.l) } : undefined}
                        onClick={() => {
                          if (c) {
                            // 색상이 있으면 해당 색상 선택
                            setGlobalHue(c.h)
                            setGlobalSat(c.s)
                            setGlobalLight(c.l)
                            setSelectedPaletteIndex(null)
                          } else {
                            // 빈칸이면 슬롯 선택 (버킷으로 채울 준비)
                            setSelectedPaletteIndex(selectedPaletteIndex === i ? null : i)
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          // 우클릭: 슬롯 비우기
                          setColorPalette(prev => {
                            const newPalette = [...prev]
                            newPalette[i] = null
                            localStorage.setItem('ai-studio-color-palette', JSON.stringify(newPalette))
                            return newPalette
                          })
                        }}
                        title={c ? `H:${c.h} S:${c.s} L:${c.l} (우클릭: 삭제)` : '클릭하여 선택 후 🪣 버킷으로 채우기'}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </>
        </div>

        {/* 중앙 패널: 라이브러리 + 미리보기 */}
        <div className="center-panel">
          <div
            className={`lib-area ${isDraggingOver ? 'drag-over' : ''}`}
            style={{ width: libWidth }}
            onDrop={handleLibraryDrop}
            onDragOver={handleLibraryDragOver}
            onDragLeave={handleLibraryDragLeave}
          >
            {isDraggingOver && (
              <div className="drop-overlay">
                <div className="drop-message">📥 이미지를 여기에 놓으세요</div>
              </div>
            )}
            {/* 라이브러리 헤더 - 그리드 내부 상단에 고정 */}
            <div className="lib-header-inline">
              <span className="title">📸 라이브러리</span>
              <span className="count">{library.length}</span>
              {transparentProgress && (
                <span className="progress-text">⏳ {transparentProgress}</span>
              )}
              <div className="spacer" />
              <button className="btn-icon" onClick={() => document.getElementById('lib-upload')?.click()} title="업로드">
                📤
              </button>
              <input type="file" id="lib-upload" accept="image/*" multiple hidden onChange={handleLibraryUpload} />
              <button className="btn-icon danger" onClick={clearLibrary} title="전체삭제">
                🗑️
              </button>
            </div>
            <div className="lib-grid large">
              {/* 생성 중인 슬롯 */}
              {generatingSlots.map((slot) => (
                <div key={slot.id} className={`lib-card generating ${slot.status}`}>
                  <div className="generating-content">
                    {slot.status === 'failed' ? (
                      <>
                        <div className="failed-icon">❌</div>
                        <span className="generating-text failed-text">생성 실패</span>
                        <span className="failed-error">{slot.error || '알 수 없는 오류'}</span>
                      </>
                    ) : (
                      <>
                        <div className="spinner" />
                        <span className="generating-text">
                          {slot.progress || (slot.status === 'transparent' ? '투명화 중...' : slot.status === 'cancelled' ? '취소됨' : '생성 중...')}
                        </span>
                        <span className="generating-index">#{slot.index + 1}</span>
                        {slot.status === 'transparent' && (
                          <span className="generating-status-badge">🔮 투명화</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="actions">
                    {slot.status === 'failed' ? (
                      <button onClick={() => setGeneratingSlots(prev => prev.filter(s => s.id !== slot.id))} title="닫기">
                        ✖️
                      </button>
                    ) : (
                      <button onClick={() => cancelSlot(slot.id)} title="이 이미지 취소" disabled={slot.status === 'cancelled'}>
                        ⏹️
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {/* 생성된 이미지 - 클릭 시 선택, Ctrl+클릭으로 다중 선택 */}
              {library.length === 0 && generatingSlots.length === 0 ? (
                <div className="empty-lib">🎨 이미지를 생성하면 여기에 표시됩니다</div>
              ) : (
                library.map((img, i) => (
                  <div
                    key={i}
                    className={`lib-card clickable ${selectedIndices.includes(i) ? 'selected' : ''} ${previewIndex === i ? 'previewing' : ''}`}
                    onClick={(e) => handleImageClick(i, e)}
                  >
                    <img src={img.url} alt={`Generated ${i}`} />
                    {selectedIndices.includes(i) && selectedIndices.length > 1 && (
                      <div className="selection-badge">{selectedIndices.indexOf(i) + 1}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 인라인 미리보기 (리사이즈 가능) */}
          <>
            {/* 리사이즈 핸들 */}
            <div
              className={`preview-resize-handle ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleResizeStart}
              title="드래그하여 크기 조절"
            >
              <div className="resize-bar" />
            </div>

            <div className="preview-panel-large">
              {/* 편집 도구 툴바 */}
              <div className="preview-toolbar">
                <button className={`tool-btn ${editTool === 'select' ? 'active' : ''}`} onClick={() => setEditTool('select')} title="선택 (V)">⬚</button>
                <button className={`tool-btn ${editTool === 'lasso' ? 'active' : ''}`} onClick={() => setEditTool('lasso')} title="올가미 (L)">〰️</button>
                <button className={`tool-btn ${editTool === 'canvas' ? 'active' : ''}`} onClick={() => setEditTool('canvas')} title="캔버스 크기 (C)">⛶</button>
                <div className="tool-divider" />
                <button className={`tool-btn ${editTool === 'marker' ? 'active' : ''}`} onClick={() => setEditTool('marker')} title="마킹 (M)">✏️</button>
                <button className={`tool-btn ${editTool === 'eyedropper' ? 'active' : ''}`} onClick={() => setEditTool('eyedropper')} title="스포이드 (I)">💧</button>
                <button className={`tool-btn ${editTool === 'bucket' ? 'active' : ''}`} onClick={() => setEditTool('bucket')} title="버킷 (G)">🪣</button>
                <button className={`tool-btn ${editTool === 'pen' ? 'active' : ''}`} onClick={() => setEditTool('pen')} title="펜 (P)">🖊️</button>
                <div className="tool-divider" />
                <span className="zoom-display">{Math.round(previewZoom * 100)}%</span>
                <button className="tool-btn" onClick={() => setPreviewZoom(prev => Math.min(prev + 0.25, 5))} title="확대">+</button>
                <button className="tool-btn" onClick={() => setPreviewZoom(prev => Math.max(prev - 0.25, 0.25))} title="축소">−</button>
                <button className="tool-btn" onClick={() => { setPreviewZoom(1); setPreviewPan({ x: 0, y: 0 }) }} title="초기화">⟲</button>
              </div>

              {/* 이미지 뷰어 영역 */}
              <div
                className="preview-viewer-area"
                onWheel={(e) => {
                  if (!currentPreviewImage) return
                  e.preventDefault()
                  const delta = e.deltaY > 0 ? -0.15 : 0.15
                  setPreviewZoom(prev => Math.min(Math.max(prev + delta, 0.25), 5))
                }}
                onMouseDown={(e) => {
                  if (!currentPreviewImage) return
                  if (isSpacePressed || e.button === 1) {
                    e.preventDefault()
                    setIsPanning(true)
                    setPanStart({ x: e.clientX - previewPan.x, y: e.clientY - previewPan.y })
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPreviewPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                style={{ cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              >
                {currentPreviewImage ? (
                  <div
                    className="preview-image-wrapper"
                    style={{ transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})` }}
                  >
                    <img src={currentPreviewImage.url} alt="Preview" className="preview-image-lg" draggable={false} />
                  </div>
                ) : (
                  <div className="preview-empty">
                    <div className="preview-empty-icon">🖼️</div>
                    <div className="preview-empty-text">라이브러리에서 이미지를 선택하세요</div>
                    <div className="preview-empty-hint">휠: 확대/축소 | Space+드래그: 패닝</div>
                  </div>
                )}
              </div>

              {/* 하단 정보바 */}
              {currentPreviewImage && (
                <div className="preview-bottom-bar">
                  <span>{selectedIndices.length > 1 ? `${selectedIndices.indexOf(previewIndex) + 1}/${selectedIndices.length} 선택됨` : `${previewIndex + 1} / ${library.length}`}</span>
                  <div className="preview-quick-actions">
                    <button onClick={() => downloadImage(currentPreviewImage, previewIndex)} title="PNG로 저장">💾</button>
                    <button onClick={selectedIndices.length > 1 ? deleteSelectedImages : () => deleteLibraryImage(previewIndex)} title="삭제" className="danger">🗑️</button>
                    <button onClick={deselectAll} title="선택 해제">✕</button>
                  </div>
                </div>
              )}
            </div>
          </>
        </div>

        {/* 우측 패널: 탭 분리 - 생성 / 편집 */}
        <div className="right-panel">
          {/* 탭 헤더 */}
          <div className="right-panel-tabs">
            <button
              className={`tab-btn ${rightPanelTab === 'generate' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('generate')}
            >
              🎨 생성
            </button>
            <button
              className={`tab-btn ${rightPanelTab === 'edit' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('edit')}
            >
              ✏️ 편집 {selectedImages.length > 0 && `(${selectedImages.length})`}
            </button>
          </div>

          {/* 생성 탭 */}
          {rightPanelTab === 'generate' && (
            <>
              {/* 프롬프트 미리보기 */}
              <div className="preview-edit-section prompt-section">
                <div className="preview-edit-title">
                  <span>✨ 현재 프롬프트</span>
                  <div className="prompt-actions-inline">
                    <button className="btn-mini" onClick={() => navigator.clipboard.writeText(prompt)} title="복사">📋</button>
                  </div>
                </div>
                <div className="prompt-preview-box">
                  {prompt ? prompt.slice(0, 150) + (prompt.length > 150 ? '...' : '') : '(좌측에서 태그를 선택하세요)'}
                </div>
                {negPrompt && (
                  <div className="prompt-neg-preview">
                    <span className="neg-label">제외:</span> {negPrompt.slice(0, 40)}...
                  </div>
                )}
              </div>


              {/* 참조 이미지 (생성용) - 드래그앤드롭 지원 */}
              <div
                className={`preview-edit-section ref-section ref-dropzone ${currentState.refImgs.length === 0 ? 'empty' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over') }}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('drag-over')
                  const files = e.dataTransfer.files
                  if (files.length > 0) handleRefImageUpload(files)
                }}
              >
                <div className="preview-edit-title">
                  <span>📎 참조 이미지 {currentState.refImgs.length > 0 && `(${currentState.refImgs.length}/14)`}</span>
                </div>
                {currentState.refImgs.length > 0 ? (
                  <div className="ref-list-with-roles">
                    {currentState.refImgs.map((ref, i) => (
                      <div key={i} className="ref-item-with-role">
                        <div className="ref-item-thumb">
                          <img src={ref.url} alt={`Ref ${i}`} />
                          <button className="ref-del-btn" onClick={() => removeRefImage(i)}>×</button>
                        </div>
                        <select
                          className="ref-role-select"
                          value={ref.type}
                          onChange={(e) => updateRefType(i, e.target.value)}
                        >
                          {REF_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.icon} {role.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <label className="ref-add-btn-large">
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => {
                        if (e.target.files) handleRefImageUpload(e.target.files)
                        e.target.value = ''
                      }} />
                      <span>+ 추가</span>
                    </label>
                  </div>
                ) : (
                  <label className="ref-empty-drop">
                    <input type="file" accept="image/*" multiple hidden onChange={(e) => {
                      if (e.target.files) handleRefImageUpload(e.target.files)
                      e.target.value = ''
                    }} />
                    <div className="ref-drop-icon">📥</div>
                    <div className="ref-drop-text">이미지를 드래그하거나 클릭</div>
                    <div className="ref-drop-hint">각 이미지별로 역할 지정 가능</div>
                  </label>
                )}
              </div>

              {/* 생성 설정 */}
              <div className="preview-edit-section settings-section">
                <div className="preview-edit-title">
                  <span>⚙️ 생성 설정</span>
                </div>
                <div className="gen-settings-grid">
                  <div className="gen-setting-row">
                    <label>해상도</label>
                    <select className="sel" value={resolution} onChange={(e) => handleResolutionChange(e.target.value as ImageSize)}>
                      {IMAGE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="gen-setting-row">
                    <label>종횡비</label>
                    <select className="sel" value={ratio} onChange={(e) => setRatio(e.target.value as AspectRatio)}>
                      {ASPECT_RATIOS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="gen-setting-row">
                    <label>생성 개수</label>
                    <div className="gen-count-row">
                      <select className="sel" value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}>
                        {[1, 2, 3, 4, 6, 8, 10].map((n) => (
                          <option key={n} value={n}>{n}장</option>
                        ))}
                      </select>
                      <button className="btn-mini" onClick={() => setShowGenModal(true)} title="여러장 생성 옵션">
                        ⚙️
                      </button>
                    </div>
                  </div>
                  <div className="gen-setting-row">
                    <label>투명배경</label>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={generateTransparent} onChange={(e) => setGenerateTransparent(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="preview-edit-section action-section">
                {isGenerating ? (
                  <button className="btn-action cancel full-width" onClick={cancelGeneration}>
                    ⏹️ 생성 취소 ({generatingSlots.length})
                  </button>
                ) : (
                  <button
                    className={`btn-action generate full-width ${generateTransparent ? 'transparent-mode' : ''}`}
                    onClick={handleGenerate}
                    disabled={!apiKey}
                  >
                    {generateTransparent ? (
                      <>
                        <span className="btn-icon-glow">🔮</span>
                        <span>투명배경 생성</span>
                        <span className="btn-badge">2x API</span>
                      </>
                    ) : (
                      <>🎨 이미지 생성</>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* 편집 탭 */}
          {rightPanelTab === 'edit' && (
            <>
              {/* 편집 대상 미리보기 - 격자로 모든 이미지 표시 */}
              <div className="preview-edit-section compact">
                <div className="preview-edit-title">
                  <span>🖼️ 편집 대상 {selectedImages.length > 0 && `(${selectedImages.length})`}</span>
                  {selectedImages.length > 0 && (
                    <button className="btn-mini" onClick={deselectAll} title="선택 해제">✕</button>
                  )}
                </div>
                {selectedImages.length > 0 ? (
                  <div className="edit-target-grid">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="edit-target-thumb">
                        <img src={img.url} alt={`Target ${i}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="edit-empty-hint">
                    라이브러리에서 이미지 선택<br/>
                    <small>Ctrl+클릭으로 다중 선택 / 방향키로 이동</small>
                  </div>
                )}
              </div>

              {/* 편집 프롬프트 직접 입력 - 최상단 배치 */}
              <div className="preview-edit-section prompt-section">
                <div className="preview-edit-title">
                  <span>✍️ 편집 내용</span>
                  <button className="btn-mini" onClick={() => setEditPromptText('')} title="지우기">🗑️</button>
                </div>
                <textarea
                  className="preview-edit-prompt"
                  value={editPromptText}
                  onChange={(e) => setEditPromptText(e.target.value)}
                  placeholder="편집할 내용을 입력하세요...&#10;예: 표정을 웃는 얼굴로 변경&#10;예: 배경을 바다로 변경&#10;예: 소품 추가 (참조 이미지 사용)"
                  rows={4}
                />
              </div>

              {/* 프롬프트 태그 적용 (좌측 태그 사용) - 축소 */}
              <div className="preview-edit-section prompt-section compact">
                <div className="preview-edit-title">
                  <span>✨ 프롬프트 태그</span>
                  <button
                    className="btn-mini"
                    onClick={() => setEditPromptText(prev => prev ? prev + '\n' + prompt : prompt)}
                    title="좌측 프롬프트 추가"
                  >
                    + 적용
                  </button>
                </div>
                <div className="prompt-preview-box scrollable small" onClick={() => setEditPromptText(prompt)}>
                  {prompt ? (prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt) : '(좌측에서 태그 선택)'}
                </div>
              </div>

              {/* 편집용 참조 이미지 - 드래그앤드롭 지원 */}
              <div
                className={`preview-edit-section ref-section ref-dropzone ${editRefImages.length === 0 ? 'empty' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over') }}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('drag-over')
                  const files = e.dataTransfer.files
                  if (!files.length) return
                  const newRefs: RefImage[] = []
                  for (const file of Array.from(files)) {
                    if (!file.type.startsWith('image/')) continue
                    const url = URL.createObjectURL(file)
                    const b64 = await fileToBase64(file)
                    newRefs.push({ url, b64, type: 'object', strength: 1 })
                  }
                  setEditRefImages(prev => [...prev, ...newRefs].slice(0, 14))
                }}
              >
                <div className="preview-edit-title">
                  <span>📎 참조 이미지 {editRefImages.length > 0 && `(${editRefImages.length}/14)`}</span>
                </div>
                {editRefImages.length > 0 ? (
                  <div className="ref-list-with-roles">
                    {editRefImages.map((ref, i) => (
                      <div key={i} className="ref-item-with-role">
                        <div className="ref-item-thumb">
                          <img src={ref.url} alt={`Ref ${i}`} />
                          <button className="ref-del-btn" onClick={() => setEditRefImages(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                        </div>
                        <select
                          className="ref-role-select"
                          value={ref.type}
                          onChange={(e) => setEditRefImages(prev => prev.map((r, idx) => idx === i ? { ...r, type: e.target.value } : r))}
                        >
                          {REF_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.icon} {role.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <label className="ref-add-btn-large">
                      <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
                        const files = e.target.files
                        if (!files) return
                        const newRefs: RefImage[] = []
                        for (const file of Array.from(files)) {
                          const url = URL.createObjectURL(file)
                          const b64 = await fileToBase64(file)
                          newRefs.push({ url, b64, type: 'object', strength: 1 })
                        }
                        setEditRefImages(prev => [...prev, ...newRefs].slice(0, 14))
                        e.target.value = ''
                      }} />
                      <span>+ 추가</span>
                    </label>
                  </div>
                ) : (
                  <label className="ref-empty-drop small">
                    <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
                      const files = e.target.files
                      if (!files) return
                      const newRefs: RefImage[] = []
                      for (const file of Array.from(files)) {
                        const url = URL.createObjectURL(file)
                        const b64 = await fileToBase64(file)
                        newRefs.push({ url, b64, type: 'object', strength: 1 })
                      }
                      setEditRefImages(prev => [...prev, ...newRefs].slice(0, 14))
                      e.target.value = ''
                    }} />
                    <div className="ref-drop-icon">📥</div>
                    <div className="ref-drop-text">드래그 또는 클릭</div>
                    <div className="ref-drop-hint">소품/캐릭터 추가</div>
                  </label>
                )}
              </div>

              {/* 빠른 변환 태그 (클릭 시 프롬프트에 추가) */}
              <div className="preview-edit-section settings-section">
                <div className="preview-edit-title">
                  <span>⚡ 빠른 변환</span>
                </div>
                <div className="quick-transform-chips compact">
                  {[
                    { id: 'enhance', label: '업스케일', prompt: 'Upscale and enhance image quality, increase resolution, remove noise and artifacts, sharpen details.' },
                    { id: 'line', label: '라인', prompt: 'Extract clean black line art on white background.' },
                    { id: 'webtoon', label: '웹툰', prompt: 'Convert to Korean webtoon style with clean lines and flat colors.' },
                    { id: 'day', label: '낮', prompt: 'Change to daytime scene with bright sunlight and blue sky.' },
                    { id: 'night', label: '밤', prompt: 'Change to nighttime scene with moonlight and stars.' },
                    { id: 'flip', label: '반전', prompt: 'Mirror flip the image horizontally.' },
                    { id: 'smile', label: '웃음', prompt: 'Change character expression to smile, happy face.' },
                    { id: 'sad', label: '슬픔', prompt: 'Change character expression to sad, tearful face.' },
                    { id: 'angry', label: '화남', prompt: 'Change character expression to angry face.' },
                    { id: 'surprised', label: '놀람', prompt: 'Change character expression to surprised, shocked face with wide eyes.' },
                    { id: 'cool', label: '시크', prompt: 'Change character expression to cool, confident, mysterious look.' },
                  ].map(t => (
                    <button
                      key={t.id}
                      className="transform-chip"
                      onClick={() => {
                        // 프롬프트에 텍스트로 추가
                        setEditPromptText(prev => prev ? `${prev}\n${t.prompt}` : t.prompt)
                      }}
                      title={t.prompt}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 편집 출력 설정 (해상도/종횡비/투명배경) */}
              <div className="preview-edit-section settings-section">
                <div className="preview-edit-title">
                  <span>⚙️ 출력 설정</span>
                </div>
                <div className="gen-settings-grid compact">
                  <div className="gen-setting-row">
                    <label>해상도</label>
                    <select className="sel" value={editResolution} onChange={(e) => {
                      const newRes = e.target.value as ImageSize
                      setEditResolution(newRes)
                      // 2K/4K 선택 시 나노바나나 프로로 자동 변경
                      if (newRes === '2K' || newRes === '4K') {
                        if (!HIGH_RES_MODELS.includes(model)) {
                          setModel('gemini-3-pro-image-preview')
                        }
                      }
                    }}>
                      {IMAGE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="gen-setting-row">
                    <label>종횡비</label>
                    <select className="sel" value={editRatio} onChange={(e) => setEditRatio(e.target.value as AspectRatio)}>
                      {ASPECT_RATIOS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="gen-setting-row full-width">
                    <label>투명배경</label>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={editTransparent} onChange={(e) => setEditTransparent(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="edit-process-hint">
                  작동순서: 해상도/종횡비 적용 → 프롬프트 편집 → 투명배경
                </div>
              </div>

              {/* 유지 옵션 */}
              <div className="preview-edit-section preserve-options">
                <div className="preview-edit-title">
                  <span>🔒 유지 옵션</span>
                </div>
                <div className="preserve-options-grid">
                  <label className={`preserve-option ${editPreserveOptions.style ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={editPreserveOptions.style}
                      onChange={(e) => setEditPreserveOptions(prev => ({ ...prev, style: e.target.checked }))}
                    />
                    <span>🎨 스타일</span>
                  </label>
                  <label className={`preserve-option ${editPreserveOptions.expression ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={editPreserveOptions.expression}
                      onChange={(e) => setEditPreserveOptions(prev => ({ ...prev, expression: e.target.checked }))}
                    />
                    <span>😊 표정</span>
                  </label>
                  <label className={`preserve-option ${editPreserveOptions.pose ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={editPreserveOptions.pose}
                      onChange={(e) => setEditPreserveOptions(prev => ({ ...prev, pose: e.target.checked }))}
                    />
                    <span>🕺 포즈</span>
                  </label>
                  <label className={`preserve-option ${editPreserveOptions.background ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={editPreserveOptions.background}
                      onChange={(e) => setEditPreserveOptions(prev => ({ ...prev, background: e.target.checked }))}
                    />
                    <span>🏞️ 배경</span>
                  </label>
                </div>
              </div>

              {/* AI 편집 실행 버튼 */}
              <div className="preview-edit-section action-section">
                <button
                  className={`btn-action edit full-width ${editTransparent ? 'transparent-mode' : ''}`}
                  onClick={async () => {
                    if (selectedImages.length === 0) { alert('편집할 이미지를 선택하세요'); return }
                    if (!apiKey) { alert('API 키를 입력하세요'); return }
                    if (!editPromptText.trim()) { alert('편집 프롬프트를 입력하세요'); return }

                    setIsEditing(true)
                    setBatchProgress(0)
                    try {
                      const newImages: LibraryImage[] = []
                      const refB64s = editRefImages.map(r => r.b64)
                      const refPrompts = buildRefPrompts(editRefImages)
                      const preserveInstructions: string[] = []
                      if (editPreserveOptions.style) preserveInstructions.push('maintain the original art style')
                      if (editPreserveOptions.expression) preserveInstructions.push('keep the facial expression unchanged')
                      if (editPreserveOptions.pose) preserveInstructions.push('preserve the body pose')
                      if (editPreserveOptions.background) preserveInstructions.push('keep the background unchanged')

                      // 프롬프트에 업스케일/노이즈제거 자동 추가 (해상도 변경 시)
                      let finalPrompt = editPromptText.trim()
                      if (editResolution !== '1K') {
                        finalPrompt = `${finalPrompt}\n\nUpscale to ${editResolution} resolution, enhance details, remove noise.`
                      }
                      if (refPrompts) finalPrompt += '\n\n' + refPrompts
                      if (preserveInstructions.length > 0) finalPrompt += `\n\nImportant: ${preserveInstructions.join(', ')}.`

                      for (let i = 0; i < selectedImages.length; i++) {
                        setBatchProgress(i + 1)
                        setTransparentProgress(`이미지 ${i + 1}/${selectedImages.length} 처리 중...`)
                        const img = selectedImages[i]

                        // 1단계: 해상도/종횡비 + 프롬프트 편집
                        let result = await editImage(apiKey, img.b64, finalPrompt, model, 'image/png', refB64s.length > 0 ? refB64s : undefined, {
                          imageSize: editResolution,
                          aspectRatio: editRatio
                        })

                        // 2단계: 투명배경 처리 (옵션이 켜져있을 때만)
                        if (editTransparent) {
                          setTransparentProgress(`이미지 ${i + 1}/${selectedImages.length} 투명화 중...`)
                          const transparentResult = await createTransparentImage(apiKey, result.base64, model, (step) => {
                            setTransparentProgress(`이미지 ${i + 1}: ${step}`)
                          })
                          const b64 = transparentResult.split(',')[1]
                          newImages.push({ url: transparentResult, b64, prompt: `[투명] ${editPromptText}` })
                        } else {
                          newImages.push({ url: result.url, b64: result.base64, prompt: editPromptText })
                        }
                      }
                      setLibrary((prev) => [...newImages, ...prev])
                      setSelectedIndices([0])
                      setPreviewIndex(0)
                    } catch (err) { alert('편집 실패: ' + (err instanceof Error ? err.message : '오류')) }
                    finally { setIsEditing(false); setBatchProgress(0); setTransparentProgress(null) }
                  }}
                  disabled={isEditing || selectedImages.length === 0 || !apiKey || !editPromptText.trim()}
                >
                  {isEditing ? (
                    <>⏳ {transparentProgress || `편집중... (${batchProgress}/${selectedImages.length})`}</>
                  ) : editTransparent ? (
                    <>
                      <span className="btn-icon-glow">🔮</span>
                      <span>AI 편집 + 투명배경</span>
                    </>
                  ) : (
                    <>✏️ AI 편집 적용</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* 여러장 생성 옵션 모달 */}
      {showGenModal && (
        <div className="gen-modal show" onClick={() => setShowGenModal(false)}>
          <div className="gen-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gen-modal-title">
              ⚙️ 여러장 생성 옵션
              <button className="gen-modal-close" onClick={() => setShowGenModal(false)}>×</button>
            </div>

            <div className={`gen-mode-item ${genMode === 'same' ? 'selected' : ''}`} onClick={() => setGenMode('same')}>
              <input type="radio" name="genModeRadio" checked={genMode === 'same'} readOnly />
              <div className="gen-mode-info">
                <div className="name">📋 동일 설정</div>
                <div className="desc">같은 프롬프트로 여러장 생성 (시드만 다름)</div>
              </div>
            </div>

            <div className={`gen-mode-item ${genMode === 'random' ? 'selected' : ''}`} onClick={() => setGenMode('random')}>
              <input type="radio" name="genModeRadio" checked={genMode === 'random'} readOnly />
              <div className="gen-mode-info">
                <div className="name">🎲 랜덤 변형</div>
                <div className="desc">매 장마다 선택한 항목을 랜덤하게 변경</div>
                {genMode === 'random' && (
                  <div className="gen-mode-opts" style={{ display: 'block' }}>
                    <label><input type="checkbox" checked={randomOpts.pose} onChange={(e) => setRandomOpts((p) => ({ ...p, pose: e.target.checked }))} /> 포즈 변형</label>
                    <label><input type="checkbox" checked={randomOpts.expr} onChange={(e) => setRandomOpts((p) => ({ ...p, expr: e.target.checked }))} /> 표정 변형</label>
                    <label><input type="checkbox" checked={randomOpts.angle} onChange={(e) => setRandomOpts((p) => ({ ...p, angle: e.target.checked }))} /> 앵글 변형</label>
                    <label><input type="checkbox" checked={randomOpts.cloth} onChange={(e) => setRandomOpts((p) => ({ ...p, cloth: e.target.checked }))} /> 의상 변형</label>
                  </div>
                )}
              </div>
            </div>

            <div className={`gen-mode-item ${genMode === 'sequence' ? 'selected' : ''}`} onClick={() => setGenMode('sequence')}>
              <input type="radio" name="genModeRadio" checked={genMode === 'sequence'} readOnly />
              <div className="gen-mode-info">
                <div className="name">🔢 순차 변형</div>
                <div className="desc">특정 항목을 순서대로 변경하며 생성</div>
                {genMode === 'sequence' && (
                  <div className="gen-mode-opts" style={{ display: 'block' }}>
                    <div className="gen-seq-item">
                      <label>항목:</label>
                      <select className="sel" value={seqCategory} onChange={(e) => setSeqCategory(e.target.value)}>
                        <option value="expression">표정</option>
                        <option value="bodyPose">포즈</option>
                        <option value="viewAngle">앵글</option>
                        <option value="artStyle">화풍</option>
                      </select>
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text3)', marginTop: 4 }}>※ 생성 개수만큼 순서대로 변형됩니다</div>
                  </div>
                )}
              </div>
            </div>

            <div className={`gen-mode-item ${genMode === 'interpolate' ? 'selected' : ''}`} onClick={() => setGenMode('interpolate')}>
              <input type="radio" name="genModeRadio" checked={genMode === 'interpolate'} readOnly />
              <div className="gen-mode-info">
                <div className="name">🌈 슬라이더 그라데이션</div>
                <div className="desc">슬라이더 값을 점진적으로 변화시키며 생성</div>
                {genMode === 'interpolate' && (
                  <div className="gen-mode-opts" style={{ display: 'block' }}>
                    <div className="gen-seq-item">
                      <label>항목:</label>
                      <select className="sel" value={interpSlider} onChange={(e) => setInterpSlider(e.target.value)}>
                        <option value="age">나이</option>
                        <option value="bodyType">체형</option>
                        <option value="eyeSize">눈크기</option>
                        <option value="timeOfDay">시간대</option>
                        <option value="brightness">밝기</option>
                      </select>
                    </div>
                    <div className="gen-seq-item">
                      <label>시작:</label>
                      <input type="number" className="inp" style={{ width: 60 }} value={interpStart} onChange={(e) => setInterpStart(Number(e.target.value))} />
                      <label>끝:</label>
                      <input type="number" className="inp" style={{ width: 60 }} value={interpEnd} onChange={(e) => setInterpEnd(Number(e.target.value))} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="gen-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowGenModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={() => setShowGenModal(false)}>✅ 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 프리셋 저장 모달 */}
      {showPresetModal && (
        <div className="preset-modal show" onClick={() => setShowPresetModal(false)}>
          <div className="preset-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preset-modal-title">
              💾 프리셋 저장
              <button className="preset-modal-close" onClick={() => setShowPresetModal(false)}>×</button>
            </div>
            <div className="preset-modal-body">
              <p>현재 설정을 프리셋으로 저장합니다.</p>
              <input
                type="text"
                className="inp"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="프리셋 이름 입력..."
                style={{ width: '100%', marginTop: 10 }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveCustomPreset()}
              />
            </div>
            <div className="preset-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPresetModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={saveCustomPreset}>💾 저장</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )

  // 설정 패널 렌더링
  function renderSettings() {
    const cat = categories[currentState.cat]
    if (!cat) return null

    return (
      <div className="settings-grid">
        {Object.entries(cat.items).map(([key, item]) => {
          const val = currentState.values[key]
          const isNegItem = 'isNeg' in item && item.isNeg
          const hasVal = isNegItem ? currentState.negTags.length > 0 : val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)

          return (
            <div key={key} className={`card ${hasVal ? 'active' : ''}`}>
              <div className="card-header">
                <span className="card-icon">{'icon' in item ? item.icon : ''}</span>
                <span>{item.name}</span>
                <span className="card-val">{isNegItem ? (currentState.negTags.length > 0 ? `${currentState.negTags.length}개` : '') : getDisplayValue(item, val)}</span>
                {hasVal && (
                  <button className="card-clear" onClick={() => clearValue(key, isNegItem)}>
                    ×
                  </button>
                )}
              </div>

              {/* 태그 + 색상버킷 한줄 통합 */}
              {'tags' in item && (
                <>
                  <div className={'hasColor' in item && item.hasColor ? 'tags-with-bucket' : ''}>
                    <div className="tags">
                      {item.tags.map(([en, ko]) => {
                        const selected = isNegItem ? currentState.negTags.includes(en) : Array.isArray(val) ? (val as string[]).includes(en) : val === en
                        return (
                          <div key={en} className={`tag ${selected ? 'selected' : ''}`} onClick={() => toggleTag(key, en, isNegItem || false)}>
                            {ko}
                          </div>
                        )
                      })}
                    </div>
                    {/* 색상버킷 - 태그 옆 색상칸만 표시 */}
                    {'hasColor' in item && item.hasColor && hasVal && (
                      <div
                        className="color-inline-box"
                        onClick={() => applyBucket(key + 'Color')}
                        title="클릭하여 색상 적용"
                        style={{
                          background: hslToHex(
                            (currentState.values[key + 'Color'] as { h: number; s: number; l: number })?.h ?? 0,
                            (currentState.values[key + 'Color'] as { h: number; s: number; l: number })?.s ?? 70,
                            (currentState.values[key + 'Color'] as { h: number; s: number; l: number })?.l ?? 50
                          ),
                        }}
                      />
                    )}
                  </div>
                  {/* 태그 가중치 슬라이더 (네거티브가 아니고 선택된 태그가 있을 때) */}
                  {!isNegItem && hasVal && (
                    <div className="slider-row weight-slider">
                      <span className="slider-label">강도</span>
                      <div className="slider-track">
                        <input
                          type="range"
                          min={0.5}
                          max={1.5}
                          step={0.1}
                          value={(currentState.values[key + 'Str'] as number) ?? 1}
                          onChange={(e) => updateSlider(key + 'Str', parseFloat(e.target.value))}
                        />
                        <div
                          className="thumb"
                          style={{
                            left: `${(((currentState.values[key + 'Str'] as number) ?? 1) - 0.5) / 1 * 100}%`,
                          }}
                        />
                      </div>
                      <span className="slider-value">{(currentState.values[key + 'Str'] as number) ?? 1}x</span>
                    </div>
                  )}
                </>
              )}

              {/* 슬라이더 */}
              {'type' in item && item.type === 'slider' && (
                <div className="slider-row">
                  <span className="slider-label">{(item as SliderItem).labels?.[0] || (item as SliderItem).min}</span>
                  <div className="slider-track">
                    <input
                      type="range"
                      min={(item as SliderItem).min}
                      max={(item as SliderItem).max}
                      step={(item as SliderItem).step || 1}
                      value={(val as number) ?? (item as SliderItem).default}
                      onChange={(e) => updateSlider(key, parseFloat(e.target.value))}
                    />
                    <div
                      className="thumb"
                      style={{
                        left: `${(((val as number) ?? (item as SliderItem).default!) - (item as SliderItem).min!) / ((item as SliderItem).max! - (item as SliderItem).min!) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="slider-value">
                    {(val as number) ?? (item as SliderItem).default}
                    {(item as SliderItem).unit || ''}
                  </span>
                </div>
              )}

              {/* 색상 버킷 - 한줄로 간소화 (이름 ㅁ) */}
              {'type' in item && (item.type === 'hue' || item.type === 'skin') && (
                <div className="color-inline-row">
                  <span className="color-inline-label">{item.name}</span>
                  <div
                    className="color-inline-box"
                    onClick={() => applyBucket(key)}
                    title="클릭하여 색상 적용"
                    style={{ background: hslToHex(
                      (val as { h: number; s: number; l: number })?.h ?? 30,
                      (val as { h: number; s: number; l: number })?.s ?? 70,
                      (val as { h: number; s: number; l: number })?.l ?? 50
                    ) }}
                  />
                </div>
              )}

            </div>
          )
        })}
      </div>
    )
  }
}

// 유틸 함수
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.readAsDataURL(file)
  })
}

// 참조 이미지별로 역할에 맞는 프롬프트 생성
function buildRefPrompts(refImgs: RefImage[]): string {
  if (refImgs.length === 0) return ''

  // 이미지별 역할에 따른 프롬프트 생성
  const instructions: string[] = []

  refImgs.forEach((img, i) => {
    const role = REF_ROLES.find(r => r.id === img.type)
    if (role) {
      instructions.push(`From reference image #${i + 1}, ${role.prompt}.`)
    }
  })

  if (instructions.length === 0) {
    return `Using the ${refImgs.length} provided reference image(s) as visual guide.`
  }

  return instructions.join(' ')
}

export default AIStudio
