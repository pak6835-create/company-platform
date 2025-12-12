import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Quote.css'

// 프로젝트 유형
const PROJECT_TYPES = [
  { id: 'webtoon-bg', icon: '🏙️', title: '웹툰 배경', desc: '웹툰용 배경 제작' },
  { id: 'game-asset', icon: '🎮', title: '게임 에셋', desc: '게임용 배경/오브젝트' },
  { id: 'animation', icon: '🎬', title: '애니메이션', desc: '애니메이션 배경' },
  { id: 'illustration', icon: '🎨', title: '일러스트', desc: '일러스트 배경' },
  { id: 'concept-art', icon: '✏️', title: '컨셉 아트', desc: '컨셉 디자인' },
  { id: 'other', icon: '📦', title: '기타', desc: '기타 프로젝트' },
]

// 예산 범위
const BUDGET_OPTIONS = [
  { id: 'under-100', label: '100만원 미만' },
  { id: '100-300', label: '100~300만원' },
  { id: '300-500', label: '300~500만원' },
  { id: '500-1000', label: '500~1000만원' },
  { id: 'over-1000', label: '1000만원 이상' },
  { id: 'negotiable', label: '협의 필요' },
]

// 일정
const DEADLINE_OPTIONS = [
  { id: 'urgent', label: '1주일 이내' },
  { id: '2weeks', label: '2주 이내' },
  { id: '1month', label: '1개월 이내' },
  { id: '2months', label: '2개월 이내' },
  { id: '3months', label: '3개월 이상' },
  { id: 'flexible', label: '유연함' },
]

function Quote() {
  const [step, setStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState({
    // Step 1: 기본 정보
    name: '',
    email: '',
    phone: '',
    company: '',
    // Step 2: 프로젝트 정보
    projectType: '',
    projectTitle: '',
    budget: '',
    deadline: '',
    // Step 3: 상세 내용
    description: '',
    reference: '',
    additionalNotes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProjectTypeSelect = (typeId: string) => {
    setFormData(prev => ({ ...prev, projectType: typeId }))
  }

  const handleBudgetSelect = (budgetId: string) => {
    setFormData(prev => ({ ...prev, budget: budgetId }))
  }

  const handleDeadlineSelect = (deadlineId: string) => {
    setFormData(prev => ({ ...prev, deadline: deadlineId }))
  }

  // 파일 업로드
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 실제 백엔드 연동
    console.log('Form submitted:', formData, uploadedFiles)
    setIsSubmitted(true)
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 3))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  if (isSubmitted) {
    return (
      <div className="quote-page">
        <div className="quote-container">
          <div className="quote-form-card">
            <div className="quote-success">
              <div className="success-icon">✓</div>
              <h2>견적 요청이 접수되었습니다!</h2>
              <p>
                담당자가 검토 후 영업일 기준 1~2일 내에<br />
                입력하신 이메일로 연락드리겠습니다.
              </p>
              <Link to="/" className="btn-home">홈으로 돌아가기</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quote-page">
      {/* 히어로 */}
      <div className="quote-hero">
        <h1>프로젝트 견적 요청</h1>
        <p>프로젝트에 대해 알려주시면 맞춤 견적을 제안해드립니다.</p>
      </div>

      <div className="quote-container">
        <div className="quote-form-card">
          {/* 진행 단계 */}
          <div className="quote-steps">
            <div className="quote-step">
              <span className={`step-number ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span className={`step-label ${step >= 1 ? 'active' : ''}`}>기본 정보</span>
            </div>
            <div className={`step-connector ${step > 1 ? 'completed' : ''}`} />
            <div className="quote-step">
              <span className={`step-number ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span className={`step-label ${step >= 2 ? 'active' : ''}`}>프로젝트 정보</span>
            </div>
            <div className={`step-connector ${step > 2 ? 'completed' : ''}`} />
            <div className="quote-step">
              <span className={`step-number ${step >= 3 ? 'active' : ''}`}>3</span>
              <span className={`step-label ${step >= 3 ? 'active' : ''}`}>상세 내용</span>
            </div>
          </div>

          <form className="quote-form" onSubmit={handleSubmit}>
            {/* Step 1: 기본 정보 */}
            {step === 1 && (
              <>
                <h3 className="section-title">담당자 정보</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>이름 <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>회사/소속</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="회사명 (선택)"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>이메일 <span className="required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>연락처</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: 프로젝트 정보 */}
            {step === 2 && (
              <>
                <h3 className="section-title">프로젝트 유형</h3>
                <div className="project-type-grid">
                  {PROJECT_TYPES.map(type => (
                    <div
                      key={type.id}
                      className={`project-type-card ${formData.projectType === type.id ? 'selected' : ''}`}
                      onClick={() => handleProjectTypeSelect(type.id)}
                    >
                      <div className="project-type-icon">{type.icon}</div>
                      <h4>{type.title}</h4>
                      <p>{type.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="form-row single">
                  <div className="form-group">
                    <label>프로젝트명 <span className="required">*</span></label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={formData.projectTitle}
                      onChange={handleChange}
                      placeholder="프로젝트 이름을 입력하세요"
                      required
                    />
                  </div>
                </div>

                <h3 className="section-title">예산 범위</h3>
                <div className="budget-selector">
                  <div className="budget-options">
                    {BUDGET_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        className={`budget-option ${formData.budget === opt.id ? 'selected' : ''}`}
                        onClick={() => handleBudgetSelect(opt.id)}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="section-title">희망 일정</h3>
                <div className="budget-selector">
                  <div className="budget-options">
                    {DEADLINE_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        className={`budget-option ${formData.deadline === opt.id ? 'selected' : ''}`}
                        onClick={() => handleDeadlineSelect(opt.id)}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: 상세 내용 */}
            {step === 3 && (
              <>
                <h3 className="section-title">프로젝트 상세 설명</h3>
                <div className="form-row single">
                  <div className="form-group">
                    <label>프로젝트 설명 <span className="required">*</span></label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="프로젝트에 대해 자세히 설명해주세요. (작품 장르, 원하는 스타일, 분량 등)"
                      required
                    />
                  </div>
                </div>
                <div className="form-row single">
                  <div className="form-group">
                    <label>참고 레퍼런스</label>
                    <textarea
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="참고할 만한 작품이나 스타일이 있다면 알려주세요. (URL 또는 설명)"
                    />
                  </div>
                </div>

                <h3 className="section-title">참고 자료 첨부</h3>
                <div
                  className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.zip"
                  />
                  <div className="file-upload-icon">📁</div>
                  <h4>파일을 드래그하거나 클릭하여 업로드</h4>
                  <p>이미지, PDF, 문서, ZIP (최대 10MB)</p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="uploaded-file">
                        <span className="uploaded-file-info">
                          📄 {file.name} ({(file.size / 1024).toFixed(1)}KB)
                        </span>
                        <button
                          type="button"
                          className="uploaded-file-remove"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-row single">
                  <div className="form-group">
                    <label>추가 요청사항</label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleChange}
                      placeholder="기타 요청사항이나 궁금한 점이 있다면 적어주세요."
                    />
                  </div>
                </div>
              </>
            )}

            {/* 네비게이션 */}
            <div className="quote-nav">
              {step > 1 ? (
                <button type="button" className="btn-prev" onClick={prevStep}>
                  ← 이전
                </button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <button type="button" className="btn-next" onClick={nextStep}>
                  다음 →
                </button>
              ) : (
                <button type="submit" className="btn-submit">
                  견적 요청하기
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Quote
