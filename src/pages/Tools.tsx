import { Link } from 'react-router-dom'
import './Tools.css'

function Tools() {
  const tools = [
    {
      id: 'webtoon-ai',
      name: '웹툰 AI 에셋 생성기',
      description: '프롬프트 하나로 라인아트, 플랫컬러, 재질맵 등 5가지 에셋 자동 생성',
      status: 'available',
      path: '/tools/webtoon-ai'
    },
    {
      id: 'background-gen',
      name: '배경 생성기',
      description: 'AI 기반 웹툰 배경 이미지 생성',
      status: 'coming',
      path: '#'
    },
    {
      id: 'color-palette',
      name: '컬러 팔레트',
      description: '웹툰에 최적화된 색상 조합 추천',
      status: 'coming',
      path: '#'
    }
  ]

  return (
    <div className="tools-page">
      <header className="tools-header">
        <p>AI TOOLS</p>
        <h1>AI 도구</h1>
        <span className="tools-description">웹툰 제작을 위한 AI 기반 도구 모음</span>
      </header>

      <div className="tools-grid">
        {tools.map((tool, index) => (
          <Link
            key={tool.id}
            to={tool.path}
            className={`tool-card ${tool.status === 'coming' ? 'disabled' : ''}`}
          >
            <span className="tool-number">{String(index + 1).padStart(2, '0')}</span>
            <div className="tool-status">
              {tool.status === 'available' ? '사용 가능' : '준비 중'}
            </div>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            {tool.status === 'available' && (
              <span className="tool-arrow">→</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Tools
