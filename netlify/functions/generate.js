// Netlify Function: Gemini/Imagen API 프록시
export async function handler(event) {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { prompt, image, apiKey, model = 'gemini-2.0-flash-exp' } = JSON.parse(event.body)

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required' })
      }
    }

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      }
    }

    // Imagen 모델 처리 (다른 API 엔드포인트 사용)
    if (model.startsWith('imagen')) {
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

      const requestBody = {
        instances: [{ prompt: prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          personGeneration: 'allow_all'
        }
      }

      // 참조 이미지가 있으면 추가
      if (image) {
        requestBody.instances[0].referenceImages = [{
          referenceImage: {
            bytesBase64Encoded: image.replace(/^data:image\/\w+;base64,/, '')
          },
          referenceType: 'REFERENCE_TYPE_STYLE'
        }]
      }

      const response = await fetch(imagenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ error: `Imagen API error: ${errorText}` })
        }
      }

      const data = await response.json()

      // Imagen 응답을 Gemini 형식으로 변환 (프론트엔드 호환)
      if (data.predictions && data.predictions[0]) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            candidates: [{
              content: {
                parts: [{
                  inlineData: {
                    data: data.predictions[0].bytesBase64Encoded
                  }
                }]
              }
            }]
          })
        }
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Imagen 응답에서 이미지를 찾을 수 없습니다' })
      }
    }

    // Gemini 모델 처리
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const contents = [{
      parts: [{ text: prompt }]
    }]

    // 이미지가 있으면 추가
    if (image) {
      contents[0].parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: image.replace(/^data:image\/\w+;base64,/, '')
        }
      })
    }

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Gemini API error: ${errorText}` })
      }
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }

  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
