import { useState, useEffect } from 'react'
import { useSite } from '../context/SiteContext'
import './ChatWidget.css'

function ChatWidget() {
  const { data } = useSite()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // 3초 후 툴팁 표시, 닫으면 다시 표시 안 함
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpen) setShowTooltip(false)
  }, [isOpen])
  const [messages, setMessages] = useState<{ type: 'bot' | 'user'; text: string }[]>([
    { type: 'bot', text: `안녕하세요! ${data.company.name}입니다. 무엇을 도와드릴까요?` }
  ])
  const [input, setInput] = useState('')

  const quickReplies = [
    '견적 문의',
    '작업 기간',
    '포트폴리오',
    '연락처'
  ]

  const handleQuickReply = (reply: string) => {
    setMessages(prev => [...prev, { type: 'user', text: reply }])

    setTimeout(() => {
      let response = ''
      switch (reply) {
        case '견적 문의':
          response = '견적은 작업 분량과 난이도에 따라 달라집니다. 구체적인 내용을 말씀해주시면 정확한 견적을 안내드릴게요!'
          break
        case '작업 기간':
          response = '일반적으로 배경 1컷 기준 1-3일 정도 소요됩니다. 분량과 복잡도에 따라 조율 가능합니다.'
          break
        case '포트폴리오':
          response = '상단 메뉴의 "포트폴리오"에서 다양한 작업물을 확인하실 수 있습니다!'
          break
        case '연락처':
          response = `이메일: ${data.contact.email}\n카카오톡: ${data.contact.kakao}\n운영시간: ${data.contact.businessHours}`
          break
        default:
          response = '문의 주셔서 감사합니다. 담당자가 확인 후 연락드리겠습니다!'
      }
      setMessages(prev => [...prev, { type: 'bot', text: response }])
    }, 500)
  }

  const handleSend = () => {
    if (!input.trim()) return

    setMessages(prev => [...prev, { type: 'user', text: input }])
    setInput('')

    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '문의 주셔서 감사합니다! 담당자가 확인 후 빠르게 연락드리겠습니다. 급한 문의는 카카오톡으로 연락해주세요!'
      }])
    }, 500)
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h4>{data.company.name}</h4>
                <span>보통 몇 시간 내 응답</span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.type}`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}<br/></span>
                ))}
              </div>
            ))}
          </div>

          <div className="chat-quick-replies">
            {quickReplies.map(reply => (
              <button key={reply} onClick={() => handleQuickReply(reply)}>
                {reply}
              </button>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 안내 툴팁 */}
      {showTooltip && !isOpen && (
        <div className="chat-tooltip">
          <button className="tooltip-close" onClick={() => setShowTooltip(false)}>×</button>
          <p>도움이 필요하신가요?</p>
          <span>언제든 문의해주세요!</span>
        </div>
      )}

      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>
    </div>
  )
}

export default ChatWidget
