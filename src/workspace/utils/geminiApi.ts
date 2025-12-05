/**
 * Gemini API 공통 유틸리티
 * 이미지 생성 및 편집을 위한 API 호출 함수들
 *
 * 사용법:
 * import { generateImage, editImage, extractAlpha, MODELS, IMAGE_SIZES, ASPECT_RATIOS } from '../utils/geminiApi'
 */

// 사용 가능한 모델 목록 (나노바나나 3 Pro만 사용)
// https://ai.google.dev/gemini-api/docs/image-generation
export const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: '나노바나나 3 Pro' },
]

// 이미지 해상도 옵션 (공식 문서: 대문자 K 필수)
export const IMAGE_SIZES = ['1K', '2K', '4K'] as const
export type ImageSize = typeof IMAGE_SIZES[number]

// 종횡비 옵션 (공식 문서 기준)
export const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const
export type AspectRatio = typeof ASPECT_RATIOS[number]

// 이미지 생성 옵션 타입
export interface ImageOptions {
  aspectRatio?: AspectRatio
  imageSize?: ImageSize
}

// API 응답에서 이미지 base64 추출
const extractImageFromResponse = (result: any): string | null => {
  const parts = result.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data
    }
  }
  return null
}

/**
 * 텍스트 프롬프트로 이미지 생성
 * @param apiKey - Google AI API 키
 * @param prompt - 이미지 생성 프롬프트
 * @param model - 모델 ID (기본: 나노바나나 2.0)
 * @param options - 이미지 옵션 (해상도, 종횡비)
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  model: string = MODELS[0].id,
  options?: ImageOptions
): Promise<{ base64: string; url: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // generationConfig 구성 (공식 문서 기준)
  const generationConfig: any = {
    responseModalities: ['TEXT', 'IMAGE'],
  }

  // imageConfig 추가 (해상도/종횡비 설정)
  if (options?.aspectRatio || options?.imageSize) {
    generationConfig.imageConfig = {}
    if (options.aspectRatio) {
      generationConfig.imageConfig.aspectRatio = options.aspectRatio
    }
    if (options.imageSize) {
      generationConfig.imageConfig.imageSize = options.imageSize
    }
  }

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  }

  // 디버그 로그
  console.log('[generateImage] 요청:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  const result = await response.json()
  console.log('[generateImage] 응답:', result.error ? result.error : '성공')

  if (result.error) {
    throw new Error(result.error.message || 'API 오류')
  }

  const base64 = extractImageFromResponse(result)
  if (!base64) {
    throw new Error('이미지 생성 실패')
  }

  return {
    base64,
    url: `data:image/png;base64,${base64}`,
  }
}

/**
 * 기존 이미지를 편집 (배경 변경 등)
 * @param apiKey - Google AI API 키
 * @param imageBase64 - 편집할 이미지의 base64 데이터
 * @param editPrompt - 편집 프롬프트
 * @param model - 모델 ID
 * @param mimeType - 이미지 MIME 타입
 * @param referenceBase64 - 참조 이미지의 base64 데이터 (선택, 포즈 변경 등에 사용)
 * @param options - 이미지 옵션 (해상도, 종횡비)
 */
export async function editImage(
  apiKey: string,
  imageBase64: string,
  editPrompt: string,
  model: string = MODELS[0].id,
  mimeType: string = 'image/png',
  referenceBase64?: string,
  options?: ImageOptions
): Promise<{ base64: string; url: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // 요청 parts 구성
  const parts: any[] = [
    { inlineData: { mimeType, data: imageBase64 } },
  ]

  // 참조 이미지가 있으면 추가
  if (referenceBase64) {
    parts.push({ inlineData: { mimeType, data: referenceBase64 } })
  }

  // 프롬프트 추가
  parts.push({ text: editPrompt })

  // generationConfig 구성
  const generationConfig: any = {
    responseModalities: ['TEXT', 'IMAGE'],
  }

  // imageConfig 추가 (해상도/종횡비 설정)
  if (options?.aspectRatio || options?.imageSize) {
    generationConfig.imageConfig = {}
    if (options.aspectRatio) {
      generationConfig.imageConfig.aspectRatio = options.aspectRatio
    }
    if (options.imageSize) {
      generationConfig.imageConfig.imageSize = options.imageSize
    }
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig,
  }

  // 디버그 로그 (이미지 데이터는 생략)
  console.log('[editImage] 요청:', {
    model,
    mimeType,
    promptLength: editPrompt.length,
    imageDataLength: imageBase64.length,
    hasReference: !!referenceBase64,
    referenceLength: referenceBase64?.length || 0,
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  const result = await response.json()
  console.log('[editImage] 응답:', result.error ? result.error : '성공')

  if (result.error) {
    throw new Error(result.error.message || 'API 오류')
  }

  const base64 = extractImageFromResponse(result)
  if (!base64) {
    throw new Error('이미지 편집 실패')
  }

  return {
    base64,
    url: `data:image/png;base64,${base64}`,
  }
}

/**
 * 이미지 데이터를 특정 크기로 리사이즈
 */
function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
  // 원본 캔버스
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imageData.width
  srcCanvas.height = imageData.height
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.putImageData(imageData, 0, 0)

  // 타겟 캔버스
  const dstCanvas = document.createElement('canvas')
  dstCanvas.width = targetWidth
  dstCanvas.height = targetHeight
  const dstCtx = dstCanvas.getContext('2d')!
  dstCtx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight)

  return dstCtx.getImageData(0, 0, targetWidth, targetHeight)
}

/**
 * 두 이미지(흰배경/검정배경)를 비교하여 알파 채널 추출
 * Medium 기사 방식: https://jidefr.medium.com/generating-transparent-background-images-with-nano-banana-pro-2
 */
export function extractAlpha(whiteImageData: ImageData, blackImageData: ImageData): ImageData {
  // 이미지 크기가 다르면 검정배경 이미지를 흰배경 크기로 리사이즈
  let blackData = blackImageData
  if (whiteImageData.width !== blackImageData.width || whiteImageData.height !== blackImageData.height) {
    console.warn(`[extractAlpha] 이미지 크기 불일치! 흰배경: ${whiteImageData.width}x${whiteImageData.height}, 검정배경: ${blackImageData.width}x${blackImageData.height}`)
    console.log('[extractAlpha] 검정배경 이미지를 흰배경 크기로 리사이즈합니다.')
    blackData = resizeImageData(blackImageData, whiteImageData.width, whiteImageData.height)
  }

  const width = whiteImageData.width
  const height = whiteImageData.height
  const whitePixels = whiteImageData.data
  const blackPixels = blackData.data
  const result = new Uint8ClampedArray(whitePixels.length)

  // 흰색(255,255,255)과 검은색(0,0,0) 사이의 거리
  const bgDist = Math.sqrt(3 * 255 * 255) // ≈ 441.67

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4

    // 흰배경 이미지의 RGB
    const rW = whitePixels[offset]
    const gW = whitePixels[offset + 1]
    const bW = whitePixels[offset + 2]

    // 검정배경 이미지의 RGB
    const rB = blackPixels[offset]
    const gB = blackPixels[offset + 1]
    const bB = blackPixels[offset + 2]

    // 두 픽셀 사이의 거리 계산
    const pixelDist = Math.sqrt(
      Math.pow(rW - rB, 2) +
      Math.pow(gW - gB, 2) +
      Math.pow(bW - bB, 2)
    )

    // 알파 계산:
    // 픽셀이 100% 불투명이면 흑백에서 동일하게 보임 (pixelDist = 0)
    // 픽셀이 100% 투명이면 배경과 똑같이 보임 (pixelDist = bgDist)
    let alpha = 1 - (pixelDist / bgDist)
    alpha = Math.max(0, Math.min(1, alpha))

    // 색상 복구 (검은색 버전에서 전경색 복구)
    // C = alpha * original, 따라서 original = C / alpha
    let rOut = 0, gOut = 0, bOut = 0
    if (alpha > 0.01) {
      rOut = rB / alpha
      gOut = gB / alpha
      bOut = bB / alpha
    }

    result[offset] = Math.round(Math.min(255, rOut))
    result[offset + 1] = Math.round(Math.min(255, gOut))
    result[offset + 2] = Math.round(Math.min(255, bOut))
    result[offset + 3] = Math.round(alpha * 255)
  }

  return new ImageData(result, width, height)
}

/**
 * 이미지 URL에서 ImageData 추출
 */
export function loadImageData(imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.src = imageUrl
  })
}

/**
 * ImageData를 PNG URL로 변환
 */
export function imageDataToUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * 투명 배경 생성 (흰배경 이미지 → 검정배경 편집 → 알파 추출)
 * 순차 처리로 캐릭터 일관성 유지
 */
export async function createTransparentImage(
  apiKey: string,
  whiteImageBase64: string,
  model: string = MODELS[0].id,
  onProgress?: (step: string) => void
): Promise<string> {
  // 1단계: 검정배경으로 편집
  onProgress?.('검정배경으로 변환 중...')
  const blackResult = await editImage(
    apiKey,
    whiteImageBase64,
    'Change the white background to solid pure black #000000. Keep everything else exactly the same. Do not modify the character at all, only change the background color.',
    model
  )

  // 2단계: 알파 추출
  onProgress?.('투명 배경 생성 중...')
  const whiteUrl = `data:image/png;base64,${whiteImageBase64}`

  const [whiteData, blackData] = await Promise.all([
    loadImageData(whiteUrl),
    loadImageData(blackResult.url),
  ])

  const resultData = extractAlpha(whiteData, blackData)
  return imageDataToUrl(resultData)
}
