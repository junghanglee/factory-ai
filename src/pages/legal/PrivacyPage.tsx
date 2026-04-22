import LegalLayout from "./LegalLayout";

const PrivacyPage = () => (
  <LegalLayout
    title="개인정보처리방침 (Privacy Policy)"
    intro="링크투홀딩스(주)는 개인정보보호법 및 관련 법령에 따라 이용자의 개인정보를 안전하게 처리하기 위해 본 방침을 수립합니다."
  >
    <h2>1. 수집하는 개인정보 항목</h2>
    <ul>
      <li>회원가입: 이메일, 비밀번호(해시), 이름, 휴대전화 번호(선택)</li>
      <li>결제 처리: 결제대행사 Paddle 측에서 카드/결제수단 정보를 직접 수집하며, 회사는 거래 ID·금액·통화·결제 상태만 저장합니다.</li>
      <li>고객 지원: 문의 시 입력한 이메일, 회사명, 메시지 내용</li>
      <li>자동 수집: 접속 IP, 브라우저 종류, 쿠키, 접속 로그 (서비스 안정성·부정 이용 차단 목적)</li>
    </ul>

    <h2>2. 이용 목적</h2>
    <ul>
      <li>회원 식별 및 서비스 제공</li>
      <li>결제 처리, 환불, 영수증 발송</li>
      <li>주문 진행 및 셀러-구매자 간 소통 지원</li>
      <li>법령 준수 및 분쟁 대응</li>
    </ul>

    <h2>3. 보유 및 파기</h2>
    <p>
      회원 탈퇴 즉시 개인정보를 파기합니다. 단, 전자상거래법 등 관련 법령에 따라 결제·계약 관련 기록은 최대 5년간 보관합니다.
    </p>

    <h2>4. 제3자 제공</h2>
    <p>
      회사는 이용자 동의 또는 법령에 따른 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다. 결제 처리를 위해 Paddle.com Market Limited에 결제 관련 정보가 위탁 처리됩니다.
    </p>

    <h2>5. 처리 위탁</h2>
    <ul>
      <li>Paddle.com Market Limited — 글로벌 결제, 송금, 세무 처리 (Merchant of Record)</li>
      <li>Supabase / Google Cloud — 데이터베이스 및 파일 저장 (저장소 위치: EU·아시아 리전)</li>
    </ul>

    <h2>6. 이용자의 권리</h2>
    <p>
      이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 마이페이지에서 직접 처리하거나 <a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>로 요청할 수 있습니다.
    </p>

    <h2>7. 개인정보 보호 책임자</h2>
    <p>
      이름: 이정행 / 이메일: <a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>
    </p>
  </LegalLayout>
);

export default PrivacyPage;
