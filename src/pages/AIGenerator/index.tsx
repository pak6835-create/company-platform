import { useSharedLibrary } from '../../context/SharedLibraryContext'
import { AIStudio } from './AIStudio'

export default function AIGenerator() {
  const { addAsset } = useSharedLibrary()

  // 생성된 이미지를 라이브러리에 추가
  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    addAsset({
      url: imageUrl,
      prompt,
      category: 'ai-generated',
      source: 'whiteboard',
    })
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AIStudio onImageGenerated={handleImageGenerated} />
    </div>
  )
}
