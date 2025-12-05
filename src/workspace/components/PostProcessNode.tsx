import { useState, useEffect, useMemo, useCallback } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { PostProcessNodeData, ProcessType } from '../types'
import { POSTPROCESS_NODE_CONFIG } from '../config/node-configs'

// 흰색 배경을 투명하게 변환하는 함수
const removeWhiteBackground = (imageData: ImageData, threshold: number = 240): ImageData => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // 흰색에 가까운 픽셀을 투명하게
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0 // 알파값을 0으로
    }
  }
  return imageData
}

// 검은색 배경을 투명하게 변환하는 함수
const removeBlackBackground = (imageData: ImageData, threshold: number = 15): ImageData => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // 검은색에 가까운 픽셀을 투명하게
    if (r < threshold && g < threshold && b < threshold) {
      data[i + 3] = 0 // 알파값을 0으로
    }
  }
  return imageData
}

export function PostProcessNode({ data, selected, id }: NodeProps<PostProcessNodeData>) {
  const [processType, setProcessType] = useState<ProcessType>(data.processType || 'removeBackground')
  const [intensity, setIntensity] = useState(data.intensity || 1.0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(data.selectedOptions || [])
  const [inputImage, setInputImage] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const { setNodes } = useReactFlow()

  // 연결된 노드에서 이미지와 API 정보 가져오기
  const edges = useStore((s) => s.edges || [])
  const nodes = useStore((s) => s.nodes || [])

  // AI 생성기에서 연결된 정보 찾기
  const connectedData = useMemo(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) return null

    const sourceEdge = edges.find((e) => e && e.target === id)
    if (!sourceEdge) return null

    const sourceNode = nodes.find((n) => n && n.id === sourceEdge.source)
    if (!sourceNode) return null

    // AI 생성기 노드에서 정보 가져오기
    if (sourceNode.type === 'aiGenerator') {
      return {
        image: sourceNode.data?.lastGeneratedImage || null,
        apiKey: sourceNode.data?.apiKey || null,
        model: sourceNode.data?.model || null,
      }
    }
    // 이미지 노드에서 이미지 가져오기
    if (sourceNode.type === 'image') {
      return {
        image: sourceNode.data?.imageUrl || sourceNode.data?.image || null,
        apiKey: null,
        model: null,
      }
    }
    return null
  }, [edges, nodes, id])

  useEffect(() => {
    if (connectedData?.image) {
      setInputImage(connectedData.image)
      setOutputImage(null) // 새 이미지가 들어오면 출력 초기화
    }
  }, [connectedData?.image])

  const defaultConfig = { title: '후처리', color: '#E91E63', options: [] }
  const config = POSTPROCESS_NODE_CONFIG[processType] || POSTPROCESS_NODE_CONFIG.removeBackground || defaultConfig
  const themeColor = config?.color || '#E91E63'

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, processType, intensity, selectedOptions } }
        }
        return n
      })
    )
  }, [processType, intensity, selectedOptions, id, setNodes])

  const handleTypeChange = (newType: ProcessType) => {
    setProcessType(newType)
    setSelectedOptions([])
  }

  const toggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((i) => i !== optId) : [...prev, optId]
    )
  }

  return (
    <div
      className={`postprocess-node ${selected ? 'selected' : ''}`}
      style={{ '--pp-color': themeColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Left} id="pp-in" />
      <NodeResizer isVisible={selected} minWidth={260} minHeight={220} />

      <div className="pp-node-header" style={{ backgroundColor: themeColor }}>
        <span>✨ 후처리</span>
      </div>

      <div className="pp-node-content pp-scrollable nodrag" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pp-type-selector">
          <label>후처리 타입</label>
          <select
            className="nodrag"
            value={processType}
            onChange={(e) => handleTypeChange(e.target.value as ProcessType)}
            style={{ borderColor: themeColor }}
          >
            <option value="removeBackground">🔲 배경 제거</option>
            <option value="extractLine">✏️ 라인 추출</option>
            <option value="materialID">🏷️ 재질맵</option>
            <option value="upscale">🔍 업스케일</option>
            <option value="stylize">✨ 스타일 변환</option>
          </select>
        </div>

        <div className="pp-intensity">
          <div className="pp-intensity-label">
            <span>적용 강도</span>
            <span>{Math.round(intensity * 100)}%</span>
          </div>
          <input
            className="nodrag"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            style={{ accentColor: themeColor }}
          />
        </div>

        <div className="pp-options">
          {(config?.options || []).map((opt) => (
            <button
              key={opt.id}
              className={`pp-opt-btn ${selectedOptions.includes(opt.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleOption(opt.id)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                borderColor: selectedOptions.includes(opt.id) ? themeColor : '#ddd',
                backgroundColor: selectedOptions.includes(opt.id) ? `${themeColor}20` : '#fff',
                color: selectedOptions.includes(opt.id) ? themeColor : '#666',
              }}
            >
              {selectedOptions.includes(opt.id) && '✓ '}
              {opt.label}
            </button>
          ))}
        </div>

        {/* 입력 이미지 미리보기 */}
        {inputImage && (
          <div className="pp-image-preview">
            <label>📥 입력 이미지</label>
            <img src={inputImage} alt="Input" />
          </div>
        )}

        {/* 처리 버튼 */}
        <button
          className="pp-process-btn"
          onClick={async (e) => {
            e.stopPropagation()
            if (!inputImage) return
            setIsProcessing(true)
            setStatusText('처리 시작...')

            try {
              if (processType === 'removeBackground') {
                // 배경 제거 처리
                const apiKey = connectedData?.apiKey
                const model = connectedData?.model || 'gemini-2.5-flash-image'

                if (apiKey) {
                  // Gemini API로 검은 배경 버전 생성
                  setStatusText('AI로 배경 변환 중...')

                  // 이미지를 base64로 변환 (data: 접두사 제거)
                  const base64Image = inputImage.replace(/^data:image\/\w+;base64,/, '')

                  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
                  const requestBody = {
                    contents: [{
                      parts: [
                        {
                          inlineData: {
                            mimeType: 'image/png',
                            data: base64Image
                          }
                        },
                        {
                          text: 'Change the background to solid black color. Keep the character exactly the same, only change the white background to pure black (#000000). Output the image.'
                        }
                      ]
                    }],
                    generationConfig: {
                      responseModalities: ['TEXT', 'IMAGE']
                    },
                  }

                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                  })

                  const result = await response.json()
                  console.log('배경 변환 응답:', result)

                  if (result.error) {
                    throw new Error(result.error.message)
                  }

                  // 응답에서 이미지 추출
                  let blackBgImage: string | null = null
                  const parts = result.candidates?.[0]?.content?.parts || []
                  for (const part of parts) {
                    if (part.inlineData?.data) {
                      blackBgImage = `data:image/png;base64,${part.inlineData.data}`
                      break
                    }
                  }

                  if (blackBgImage) {
                    // Canvas로 검은 배경을 투명으로 변환
                    setStatusText('투명 배경 생성 중...')
                    const img = new Image()
                    img.crossOrigin = 'anonymous'

                    await new Promise<void>((resolve, reject) => {
                      img.onload = () => {
                        const canvas = document.createElement('canvas')
                        canvas.width = img.width
                        canvas.height = img.height
                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                          reject(new Error('Canvas context 생성 실패'))
                          return
                        }

                        ctx.drawImage(img, 0, 0)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                        // 강도에 따른 임계값 조정
                        const threshold = Math.round(15 + (1 - intensity) * 30)
                        const processed = removeBlackBackground(imageData, threshold)
                        ctx.putImageData(processed, 0, 0)

                        setOutputImage(canvas.toDataURL('image/png'))
                        resolve()
                      }
                      img.onerror = reject
                      img.src = blackBgImage
                    })
                  } else {
                    throw new Error('AI 응답에 이미지가 없습니다')
                  }
                } else {
                  // API 키 없으면 흰색 배경 직접 제거
                  setStatusText('흰색 배경 제거 중...')
                  const img = new Image()
                  img.crossOrigin = 'anonymous'

                  await new Promise<void>((resolve, reject) => {
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      canvas.width = img.width
                      canvas.height = img.height
                      const ctx = canvas.getContext('2d')
                      if (!ctx) {
                        reject(new Error('Canvas context 생성 실패'))
                        return
                      }

                      ctx.drawImage(img, 0, 0)
                      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                      // 강도에 따른 임계값 조정 (높을수록 더 많은 흰색 제거)
                      const threshold = Math.round(200 + intensity * 55)
                      const processed = removeWhiteBackground(imageData, threshold)
                      ctx.putImageData(processed, 0, 0)

                      setOutputImage(canvas.toDataURL('image/png'))
                      resolve()
                    }
                    img.onerror = reject
                    img.src = inputImage
                  })
                }
              } else {
                // 다른 후처리는 아직 미구현 (원본 유지)
                setStatusText('처리 중...')
                await new Promise(r => setTimeout(r, 500))
                setOutputImage(inputImage)
              }

              setStatusText('완료!')
            } catch (err) {
              console.error('후처리 오류:', err)
              setStatusText(err instanceof Error ? err.message : '처리 실패')
            } finally {
              setIsProcessing(false)
              setTimeout(() => setStatusText(''), 3000)
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={!inputImage || isProcessing}
          style={{ backgroundColor: themeColor }}
        >
          {isProcessing ? '⏳ 처리 중...' : '✨ 후처리 적용'}
        </button>

        {/* 상태 텍스트 */}
        {statusText && (
          <div className="pp-status" style={{ color: themeColor }}>
            {statusText}
          </div>
        )}

        {/* 출력 이미지 미리보기 */}
        {outputImage && (
          <div className="pp-image-preview output">
            <label>📤 출력 이미지</label>
            <img src={outputImage} alt="Output" />
            <button
              className="pp-download-btn"
              onClick={(e) => {
                e.stopPropagation()
                const link = document.createElement('a')
                link.href = outputImage
                link.download = `processed-${Date.now()}.png`
                link.click()
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              ⬇️ 다운로드
            </button>
          </div>
        )}

        {!inputImage && (
          <div className="pp-help">💡 AI 생성기나 이미지 노드를 연결하세요</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="pp-out" />
    </div>
  )
}
