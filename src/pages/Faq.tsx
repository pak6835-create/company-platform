import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Faq.css'

// FAQ 카테고리
const CATEGORIES = [
  { id: 'all', name: '전체' },
  { id: 'service', name: '서비스 안내' },
  { id: 'order', name: '의뢰/주문' },
  { id: 'price', name: '가격/결제' },
  { id: 'delivery', name: '납품/수정' },
  { id: 'etc', name: '기타' },
]

// FAQ 데이터
const FAQ_DATA = [
  {
    id: 1,
    category: 'service',
    question: '수요일오전은 어떤 서비스를 제공하나요?',
    answer: `수요일오전은 웹툰 배경 전문 제작 스튜디오입니다. 주요 서비스는 다음과 같습니다:
    <ul>
      <li>웹툰용 배경 일러스트 제작</li>
      <li>3D 모델링 기반 배경 제작</li>
      <li>게임/애니메이션용 배경 에셋</li>
      <li>컨셉 아트 및 디자인</li>
      <li>AI 활용 배경 생성 솔루션</li>
    </ul>`,
  },
  {
    id: 2,
    category: 'service',
    question: '작업 가능한 스타일은 어떤 것들이 있나요?',
    answer: '한국 웹툰 스타일, 일본 만화 스타일, 애니메이션 배경, 세미 리얼리즘, 페인팅 스타일 등 다양한 스타일의 작업이 가능합니다. 레퍼런스를 보내주시면 해당 스타일에 맞춰 제작해 드립니다.',
  },
  {
    id: 3,
    category: 'order',
    question: '의뢰는 어떻게 진행되나요?',
    answer: `의뢰 진행 절차는 다음과 같습니다:
    <ul>
      <li>1. 견적 요청서 작성 (프로젝트 내용, 예산, 일정 등)</li>
      <li>2. 담당자 상담 및 견적 확정</li>
      <li>3. 계약 및 선금 입금</li>
      <li>4. 작업 진행 (중간 확인 포함)</li>
      <li>5. 최종 검수 및 수정</li>
      <li>6. 잔금 입금 및 원본 파일 전달</li>
    </ul>`,
  },
  {
    id: 4,
    category: 'order',
    question: '최소 주문 수량이 있나요?',
    answer: '최소 주문 수량은 없습니다. 단일 배경 1장부터 대량 프로젝트까지 모두 가능합니다. 다만, 대량 주문 시 할인 혜택이 적용될 수 있습니다.',
  },
  {
    id: 5,
    category: 'price',
    question: '가격은 어떻게 책정되나요?',
    answer: '가격은 작업 난이도, 배경 종류(실내/실외/판타지 등), 디테일 수준, 납기일 등에 따라 달라집니다. 정확한 견적은 상담을 통해 안내드리며, 예산에 맞춘 작업도 가능합니다.',
  },
  {
    id: 6,
    category: 'price',
    question: '결제는 어떻게 하나요?',
    answer: '계좌이체와 세금계산서 발행이 가능합니다. 일반적으로 계약 시 50% 선금, 최종 납품 시 50% 잔금으로 진행됩니다. 협의에 따라 결제 조건은 조정 가능합니다.',
  },
  {
    id: 7,
    category: 'delivery',
    question: '작업 기간은 얼마나 걸리나요?',
    answer: '단순 배경은 3~5일, 복잡한 배경은 1~2주 정도 소요됩니다. 대량 주문이나 복잡한 프로젝트는 별도 협의가 필요합니다. 급한 일정의 경우 추가 비용이 발생할 수 있습니다.',
  },
  {
    id: 8,
    category: 'delivery',
    question: '수정은 몇 번까지 가능한가요?',
    answer: '기본 2회의 수정이 포함되어 있습니다. 컨셉 변경이나 대폭 수정이 아닌 세부 수정 위주입니다. 추가 수정이 필요한 경우 별도 협의 후 진행됩니다.',
  },
  {
    id: 9,
    category: 'delivery',
    question: '납품되는 파일 형식은 무엇인가요?',
    answer: 'PSD(레이어 포함), PNG, JPG 형식으로 납품됩니다. 해상도는 용도에 맞게 조정 가능하며, 특별히 요청하시는 형식이 있다면 사전에 말씀해 주세요.',
  },
  {
    id: 10,
    category: 'etc',
    question: '저작권은 어떻게 되나요?',
    answer: '납품된 결과물의 저작권은 의뢰인에게 귀속됩니다. 다만, 포트폴리오 게시 허용 여부는 별도 협의가 필요합니다. 저작권 관련 세부 사항은 계약서에 명시됩니다.',
  },
  {
    id: 11,
    category: 'etc',
    question: 'NDA(비밀유지계약)가 가능한가요?',
    answer: '네, NDA 체결이 가능합니다. 프로젝트의 기밀 유지가 필요한 경우 계약 전 말씀해 주시면 NDA를 체결하고 진행합니다.',
  },
]

function Faq() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [openId, setOpenId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 필터링된 FAQ
  const filteredFaq = FAQ_DATA.filter(faq => {
    const matchCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="faq-page">
      {/* 히어로 */}
      <div className="faq-hero">
        <h1>자주 묻는 질문</h1>
        <p>궁금한 점을 빠르게 확인해보세요</p>
      </div>

      <div className="faq-container">
        {/* 검색 */}
        <div className="faq-search">
          <div className="faq-search-wrapper">
            <span className="faq-search-icon">🔍</span>
            <input
              type="text"
              className="faq-search-input"
              placeholder="질문 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="faq-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`faq-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ 리스트 */}
        <div className="faq-list">
          {filteredFaq.map(faq => (
            <div
              key={faq.id}
              className={`faq-item ${openId === faq.id ? 'open' : ''}`}
            >
              <div className="faq-question" onClick={() => toggleItem(faq.id)}>
                <div className="faq-question-text">
                  <span className="faq-q-icon">Q</span>
                  <h3>{faq.question}</h3>
                </div>
                <span className="faq-toggle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
              <div className="faq-answer">
                <div
                  className="faq-answer-content"
                  dangerouslySetInnerHTML={{ __html: `<p>${faq.answer}</p>` }}
                />
              </div>
            </div>
          ))}
        </div>

        {filteredFaq.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            검색 결과가 없습니다.
          </div>
        )}

        {/* 문의 배너 */}
        <div className="faq-contact-banner">
          <h3>원하는 답변을 찾지 못하셨나요?</h3>
          <p>직접 문의해주시면 빠르게 답변드리겠습니다.</p>
          <div className="faq-contact-buttons">
            <Link to="/contact" className="faq-contact-btn primary">
              1:1 문의하기
            </Link>
            <Link to="/quote" className="faq-contact-btn secondary">
              견적 요청하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Faq
