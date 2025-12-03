import { useSite } from '../context/SiteContext'
import './Contact.css'

function Contact() {
  const { data } = useSite()

  return (
    <div className="contact-page">
      <header className="contact-header">
        <p>CONTACT</p>
        <h1>문의하기</h1>
      </header>

      <div className="contact-grid">
        {/* 문의 폼 */}
        <div className="contact-form-section">
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">이름 / 회사명</label>
              <input type="text" id="name" placeholder="이름 또는 회사명" />
            </div>

            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input type="email" id="email" placeholder="example@email.com" />
            </div>

            <div className="form-group">
              <label htmlFor="type">문의 유형</label>
              <select id="type">
                <option value="">선택해주세요</option>
                <option value="quote">견적 문의</option>
                <option value="project">프로젝트 의뢰</option>
                <option value="partnership">협업 제안</option>
                <option value="other">기타 문의</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">문의 내용</label>
              <textarea id="message" rows={6} placeholder="문의하실 내용을 자세히 적어주세요"></textarea>
            </div>

            <button type="submit" className="btn btn-primary btn-full">문의 보내기</button>
          </form>
        </div>

        {/* 연락처 정보 */}
        <div className="contact-info-section">
          <div className="contact-card">
            <h3>CONTACT INFO</h3>
            <div className="contact-item">
              <p className="contact-label">이메일</p>
              <p className="contact-value">{data.contact.email}</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">전화</p>
              <p className="contact-value">{data.contact.phone}</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">카카오톡</p>
              <p className="contact-value">{data.contact.kakao}</p>
            </div>
          </div>

          <div className="contact-card">
            <h3>BUSINESS HOURS</h3>
            <div className="hours-item">
              <span>평일</span>
              <span>{data.contact.businessHours.weekday}</span>
            </div>
            <div className="hours-item">
              <span>점심시간</span>
              <span>{data.contact.businessHours.lunch}</span>
            </div>
            <div className="hours-item">
              <span>주말/공휴일</span>
              <span>{data.contact.businessHours.weekend}</span>
            </div>
          </div>

          <div className="contact-card">
            <h3>NOTE</h3>
            <p className="quick-note">
              문의 주시면 영업일 기준 1-2일 내에 답변 드립니다.
              급한 문의는 카카오톡으로 연락주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
