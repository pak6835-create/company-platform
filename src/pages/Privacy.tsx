import './Legal.css'

function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>개인정보처리방침</h1>
          <p>시행일: 2025년 1월 1일</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>제1조 (개인정보의 처리 목적)</h2>
            <p>
              수요일오전(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ol>
              <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</li>
              <li>서비스 제공: 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 요금결제·정산</li>
              <li>마케팅 및 광고: 이벤트 및 광고성 정보 제공, 서비스의 유효성 확인, 접속빈도 파악, 서비스 이용에 대한 통계</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>제2조 (개인정보의 처리 및 보유기간)</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>보유 항목</th>
                  <th>보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>회원 정보</td>
                  <td>이메일, 비밀번호, 닉네임</td>
                  <td>회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td>결제 정보</td>
                  <td>결제 기록, 환불 기록</td>
                  <td>5년 (전자상거래법)</td>
                </tr>
                <tr>
                  <td>서비스 이용 기록</td>
                  <td>접속 로그, 서비스 이용 기록</td>
                  <td>3개월 (통신비밀보호법)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>제3조 (처리하는 개인정보의 항목)</h2>
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ol>
              <li>필수항목: 이메일 주소, 비밀번호, 닉네임</li>
              <li>선택항목: 프로필 이미지, 휴대폰 번호, 회사명</li>
              <li>자동 수집 항목: IP 주소, 쿠키, 서비스 이용 기록, 방문 기록</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>제4조 (개인정보의 제3자 제공)</h2>
            <p>
              회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
            </p>
          </section>

          <section className="legal-section">
            <h2>제5조 (개인정보처리의 위탁)</h2>
            <p>
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>수탁업체</th>
                  <th>위탁업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>카카오</td>
                  <td>소셜 로그인 서비스</td>
                </tr>
                <tr>
                  <td>구글</td>
                  <td>소셜 로그인 서비스, 클라우드 서비스</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ol>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p>
              권리 행사는 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section className="legal-section">
            <h2>제7조 (개인정보의 파기)</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            </p>
            <ol>
              <li>파기절차: 불필요한 개인정보는 개인정보관리책임자의 승인을 받아 파기합니다.</li>
              <li>파기방법: 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하고, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>제8조 (개인정보의 안전성 확보조치)</h2>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ol>
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>제9조 (쿠키의 사용)</h2>
            <p>
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
            </p>
            <ol>
              <li>쿠키의 사용 목적: 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.</li>
              <li>쿠키의 설치·운영 및 거부: 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
              <li>쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>제10조 (개인정보 보호책임자)</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="legal-highlight">
              <p><strong>개인정보 보호책임자</strong></p>
              <p>성명: 박기호</p>
              <p>직책: 대표</p>
              <p>연락처: contact@wedsam.com</p>
            </div>
          </section>

          <section className="legal-section">
            <h2>제11조 (개인정보 처리방침 변경)</h2>
            <p>
              이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다. 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.
            </p>
          </section>

          <div className="legal-highlight">
            <p>본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
          </div>

          <div className="legal-contact">
            <h4>문의사항</h4>
            <p>개인정보처리방침에 대한 문의사항이 있으시면 <a href="mailto:contact@wedsam.com">contact@wedsam.com</a>으로 연락해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
