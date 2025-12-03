import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import './Portfolio.css'

function Portfolio() {
  const { data } = useSite()
  const [filter, setFilter] = useState('전체')
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const years = ['전체', ...Array.from(new Set(data.portfolio.map(item => item.year))).sort((a, b) => b.localeCompare(a))]

  const filteredItems = filter === '전체'
    ? data.portfolio
    : data.portfolio.filter(item => item.year === filter)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.portfolio-card').forEach(card => {
      observerRef.current?.observe(card)
    })

    return () => observerRef.current?.disconnect()
  }, [filteredItems])

  const selectedPortfolio = selectedItem !== null
    ? data.portfolio.find(item => item.id === selectedItem)
    : null

  return (
    <div className="portfolio-page">
      <header className="portfolio-header">
        <p>PORTFOLIO</p>
        <h1>포트폴리오</h1>
      </header>

      <div className="portfolio-filters">
        {years.map(year => (
          <button
            key={year}
            className={`filter-btn ${filter === year ? 'active' : ''}`}
            onClick={() => setFilter(year)}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="portfolio-masonry">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className="portfolio-card"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => setSelectedItem(item.id)}
          >
            <div className="portfolio-image-wrapper">
              <img src={item.image} alt={item.title} className="portfolio-image" />
              <div className="portfolio-overlay">
                <span className="view-btn">View</span>
              </div>
            </div>
            <div className="portfolio-info">
              <h3>{item.title}</h3>
              <div className="portfolio-meta">
                <span className="category">{item.category}</span>
                <span className="year">{item.year}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="portfolio-cta">
        <p>더 많은 작업물이 궁금하시다면</p>
        <Link to="/contact" className="btn btn-primary">문의하기</Link>
      </div>

      {/* 모달 */}
      {selectedPortfolio && (
        <div className="portfolio-modal" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>×</button>
            <div className="modal-image-container">
              <img src={selectedPortfolio.image} alt={selectedPortfolio.title} />
            </div>
            <div className="modal-info">
              <h2>{selectedPortfolio.title}</h2>
              <div className="modal-meta">
                <span>{selectedPortfolio.category}</span>
                <span>{selectedPortfolio.year}</span>
              </div>
              {selectedPortfolio.description && (
                <p className="modal-description">{selectedPortfolio.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Portfolio
