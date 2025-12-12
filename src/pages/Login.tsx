import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

type AuthMode = 'login' | 'register'

function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 폼 데이터
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeTerms: false,
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 유효성 검사
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (mode === 'register') {
      if (!formData.name) {
        setError('이름을 입력해주세요.')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }
      if (formData.password.length < 8) {
        setError('비밀번호는 8자 이상이어야 합니다.')
        return
      }
      if (!formData.agreeTerms) {
        setError('이용약관에 동의해주세요.')
        return
      }
    }

    setIsLoading(true)

    // TODO: 실제 백엔드 연동
    // 현재는 UI 데모용 시뮬레이션
    setTimeout(() => {
      setIsLoading(false)
      if (mode === 'login') {
        setSuccess('로그인 성공! 메인 페이지로 이동합니다.')
        // TODO: 실제 로그인 처리 후 리다이렉트
      } else {
        setSuccess('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
        setMode('login')
      }
    }, 1500)
  }

  const handleSocialLogin = (provider: string) => {
    // TODO: 소셜 로그인 연동
    console.log(`${provider} 로그인 시도`)
    setError(`${provider} 로그인은 아직 준비 중입니다.`)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* 헤더 */}
          <div className="auth-header">
            <div className="auth-logo">W</div>
            <h1>수요일오전</h1>
            <p>{mode === 'login' ? '계정에 로그인하세요' : '새 계정을 만드세요'}</p>
          </div>

          {/* 탭 전환 */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              로그인
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              회원가입
            </button>
          </div>

          {/* 에러/성공 메시지 */}
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {/* 폼 */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                />
              </div>
            )}

            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
            </div>

            <div className="form-group">
              <label>비밀번호</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'register' ? '8자 이상 입력' : '비밀번호 입력'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>비밀번호 확인</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="비밀번호 다시 입력"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' ? (
              <div className="form-options">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>로그인 상태 유지</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  비밀번호 찾기
                </Link>
              </div>
            ) : (
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <span>
                  <Link to="/terms">이용약관</Link> 및 <Link to="/privacy">개인정보처리방침</Link>에 동의합니다
                </span>
              </label>
            )}

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="auth-divider">
            <span>또는</span>
          </div>

          {/* 소셜 로그인 */}
          <div className="social-buttons">
            <button
              type="button"
              className="social-button google"
              onClick={() => handleSocialLogin('Google')}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <button
              type="button"
              className="social-button kakao"
              onClick={() => handleSocialLogin('Kakao')}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#000" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.2.72-.72 2.64-.84 3.06-.12.54.2.54.42.42.18-.06 2.82-1.92 3.96-2.7.6.06 1.26.12 1.92.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>

          {/* 하단 */}
          <div className="auth-footer">
            <p>
              {mode === 'login' ? (
                <>계정이 없으신가요? <Link to="#" onClick={() => setMode('register')}>회원가입</Link></>
              ) : (
                <>이미 계정이 있으신가요? <Link to="#" onClick={() => setMode('login')}>로그인</Link></>
              )}
            </p>
          </div>
        </div>

        <Link to="/" className="back-to-home">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default Login
