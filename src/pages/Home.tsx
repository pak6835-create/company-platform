import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import './Home.css'

const partnerLogos = [
  { name: '네이버웹툰', file: '네이버웹툰.png' },
  { name: '카카오페이지', file: '카카오페이지.png' },
  { name: '카카오웹툰', file: '카카오웹툰.png' },
  { name: '네이버시리즈', file: '네이버시리즈.webp' },
  { name: '레진', file: '레진.png' },
  { name: '리디', file: '리디.png' },
  { name: '탑툰', file: '탑툰.png' },
  { name: '투믹스', file: '투믹스.png' },
  { name: '봄툰', file: '봄툰.webp' },
  { name: '미스터블루', file: '미스터블루.webp' },
]

const services = [
  {
    number: '01',
    title: '배경 일러스트',
    description: '웹툰에 최적화된 고품질 배경 일러스트를 제작합니다. 작품의 분위기와 세계관에 맞는 맞춤형 배경을 제공합니다.',
    icon: 'illustration'
  },
  {
    number: '02',
    title: '컬러링',
    description: '선화 위에 작품 분위기에 맞는 컬러링 작업을 진행합니다. 일관된 색감과 톤으로 작품의 완성도를 높입니다.',
    icon: 'coloring'
  },
  {
    number: '03',
    title: '선화 작업',
    description: '깔끔하고 정교한 선화를 제작합니다. 러프 스케치부터 클린업까지 모든 단계를 지원합니다.',
    icon: 'lineart'
  },
  {
    number: '04',
    title: '수정 및 보완',
    description: '기존 배경의 수정, 보완, 리터칭 작업을 진행합니다. 빠른 피드백 반영으로 효율적인 작업이 가능합니다.',
    icon: 'edit'
  }
]

// 서비스 아이콘 SVG 컴포넌트
function ServiceIcon({ type }: { type: string }) {
  switch (type) {
    case 'illustration':
      return (
        <svg viewBox="0 0 120 120" className="service-icon">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {/* 건물/도시 배경 */}
          <rect x="10" y="60" width="20" height="50" fill="#e5e7eb" rx="2"/>
          <rect x="35" y="40" width="25" height="70" fill="#d1d5db" rx="2"/>
          <rect x="65" y="50" width="20" height="60" fill="#e5e7eb" rx="2"/>
          <rect x="90" y="65" width="20" height="45" fill="#d1d5db" rx="2"/>
          {/* 창문들 */}
          <rect x="14" y="65" width="5" height="6" fill="#93c5fd"/>
          <rect x="14" y="75" width="5" height="6" fill="#93c5fd"/>
          <rect x="40" y="45" width="6" height="8" fill="#93c5fd"/>
          <rect x="49" y="45" width="6" height="8" fill="#93c5fd"/>
          <rect x="40" y="58" width="6" height="8" fill="#93c5fd"/>
          <rect x="49" y="58" width="6" height="8" fill="#93c5fd"/>
          {/* 태양/달 */}
          <circle cx="95" cy="25" r="12" fill="url(#grad1)" opacity="0.8"/>
          {/* 구름 */}
          <ellipse cx="30" cy="25" rx="15" ry="8" fill="#f3f4f6"/>
          <ellipse cx="45" cy="25" rx="10" ry="6" fill="#f3f4f6"/>
        </svg>
      )
    case 'coloring':
      return (
        <svg viewBox="0 0 120 120" className="service-icon">
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          {/* 팔레트 */}
          <ellipse cx="60" cy="65" rx="45" ry="40" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
          {/* 색상 원들 */}
          <circle cx="35" cy="50" r="10" fill="#ef4444"/>
          <circle cx="55" cy="40" r="10" fill="#f97316"/>
          <circle cx="78" cy="45" r="10" fill="#eab308"/>
          <circle cx="85" cy="65" r="10" fill="#22c55e"/>
          <circle cx="75" cy="85" r="10" fill="#3b82f6"/>
          <circle cx="50" cy="80" r="10" fill="#8b5cf6"/>
          {/* 붓 */}
          <rect x="90" y="10" width="8" height="35" fill="#78716c" rx="2" transform="rotate(30 94 27)"/>
          <path d="M95 40 L105 55 L100 58 L90 43 Z" fill="url(#grad2)"/>
        </svg>
      )
    case 'lineart':
      return (
        <svg viewBox="0 0 120 120" className="service-icon">
          {/* 펜 */}
          <rect x="50" y="10" width="12" height="60" fill="#374151" rx="2"/>
          <polygon points="50,70 62,70 56,90" fill="#1f2937"/>
          <rect x="50" y="10" width="12" height="15" fill="#6366f1" rx="2"/>
          {/* 선화 라인들 */}
          <path d="M15 85 Q40 75, 50 90" stroke="#1f2937" strokeWidth="2" fill="none"/>
          <path d="M55 95 Q75 80, 105 95" stroke="#1f2937" strokeWidth="2" fill="none"/>
          <path d="M20 100 L45 100" stroke="#1f2937" strokeWidth="2"/>
          <path d="M70 105 L100 105" stroke="#1f2937" strokeWidth="2"/>
          {/* 점선 가이드 */}
          <path d="M15 75 L40 75" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,3"/>
          <path d="M80 75 L105 75" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,3"/>
        </svg>
      )
    case 'edit':
      return (
        <svg viewBox="0 0 120 120" className="service-icon">
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* 문서/이미지 */}
          <rect x="20" y="20" width="60" height="80" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" rx="4"/>
          <rect x="30" y="35" width="40" height="25" fill="#e5e7eb"/>
          <line x1="30" y1="70" x2="70" y2="70" stroke="#d1d5db" strokeWidth="3"/>
          <line x1="30" y1="80" x2="55" y2="80" stroke="#d1d5db" strokeWidth="3"/>
          {/* 수정 도구 (연필) */}
          <rect x="70" y="50" width="8" height="45" fill="#f59e0b" rx="1" transform="rotate(-45 74 72)"/>
          <polygon points="95,85 105,95 90,98" fill="url(#grad3)"/>
          {/* 체크마크 */}
          <circle cx="95" cy="30" r="15" fill="url(#grad3)"/>
          <polyline points="87,30 93,36 103,24" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    default:
      return null
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function Home() {
  const { data } = useSite()

  return (
    <div className="home">
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(/assets/작업사진.jpg)' }} />
        <div className="hero-inner hero-inner-centered">
          <div className="hero-content hero-content-centered">
            <p className="hero-label">{data.hero.subtitle}</p>
            <h1>{data.hero.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}</h1>
            <p className="hero-description">
              {data.hero.description.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
            <div className="hero-buttons">
              <Link to="/contact" className="btn btn-primary">프로젝트 문의</Link>
              <Link to="/portfolio" className="btn btn-ghost">포트폴리오 보기</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="services">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">SERVICES</p>
            <h2>제공 서비스</h2>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.number} className="service-card">
                <div className="service-icon-wrapper">
                  <ServiceIcon type={service.icon} />
                </div>
                <div className="service-content">
                  <div className="service-number">{service.number}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 포트폴리오 미리보기 - 무한 스크롤 캐러셀 */}
      <section className="portfolio-section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">PORTFOLIO</p>
            <h2>최근 작업</h2>
          </div>
        </div>
        <div className="portfolio-carousel">
          <div className="portfolio-track">
            {[...data.portfolio, ...data.portfolio].map((item, index) => (
              <Link key={`${item.id}-${index}`} to="/portfolio" className="portfolio-slide">
                <img src={item.image} alt={item.title} />
                <div className="portfolio-slide-info">
                  <span>{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="section-inner">
          <div className="section-cta">
            <Link to="/portfolio" className="btn btn-outline">전체 포트폴리오 보기</Link>
          </div>
        </div>
      </section>

      {/* 협력사 로고 */}
      <section className="partners">
        <div className="partners-inner">
          <p className="partners-label">TRUSTED BY</p>
          <div className="partners-track">
            <div className="partners-slide">
              {[...partnerLogos, ...partnerLogos].map((partner, i) => (
                <div key={i} className="partner-logo">
                  <img src={`/assets/partners/${partner.file}`} alt={partner.name} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 최신 소식 */}
      {data.blog.length > 0 && (
        <section className="news-section">
          <div className="section-inner">
            <div className="section-header">
              <p className="section-label">NEWS</p>
              <h2>최신 소식</h2>
            </div>
            <div className="news-grid">
              {data.blog.slice(0, 3).map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`} className="news-card">
                  <span className="news-category">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="news-date">{formatDate(post.date)}</span>
                </Link>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/blog" className="btn btn-outline">더 많은 소식 보기</Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA 섹션 */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>프로젝트를 함께 진행해보세요</h2>
          <p>작품에 맞는 최적의 배경을 제안해 드립니다</p>
          <Link to="/contact" className="btn btn-white">문의하기</Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">{data.company.name}</div>
              <p>{data.company.description}</p>
            </div>
            <div className="footer-nav">
              <div className="footer-nav-group">
                <h4>서비스</h4>
                <Link to="/portfolio">포트폴리오</Link>
                <Link to="/tools">AI 도구</Link>
              </div>
              <div className="footer-nav-group">
                <h4>문의</h4>
                <Link to="/contact">프로젝트 문의</Link>
                <a href={`mailto:${data.contact.email}`}>이메일</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 {data.company.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
