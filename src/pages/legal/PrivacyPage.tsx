import LegalLayout from "./LegalLayout";
import EnglishSummary from "@/components/legal/EnglishSummary";

const PrivacyPage = () => (
  <LegalLayout
    title="개인정보처리방침 (Privacy Policy)"
    intro="링크투홀딩스(주)는 개인정보보호법, GDPR 및 관련 법령에 따라 이용자의 개인정보를 안전하게 처리하기 위해 본 방침을 수립합니다. 개인정보 관련 문의는 junghanglee@gmail.com으로 연락 주시기 바랍니다."
  >
    <EnglishSummary summary="This Privacy Policy explains how we collect, use and protect personal data in compliance with Korea's PIPA, the EU GDPR and similar regulations. Key points: (1) we collect only the data necessary to provide our content (account info, payment metadata, support messages); (2) payment card data is collected directly by Paddle, not by us; (3) we do NOT knowingly collect data from anyone under the age of 14; (4) data may be transferred to and processed in the UK, US, EU and Asia (Paddle, Supabase, Google Cloud) under SOC 2 / ISO 27001 / GDPR safeguards; (5) you may request access, correction, deletion or portability at any time via junghanglee@gmail.com." />
    <h2>1. 수집하는 개인정보 항목</h2>
    <ul>
      <li>회원가입: 이메일, 비밀번호(해시), 이름, 휴대전화 번호(선택)</li>
      <li>결제 처리: 결제대행사 Paddle 측에서 카드/결제수단 정보를 직접 수집하며, 회사는 거래 ID·금액·통화·결제 상태만 저장합니다.</li>
      <li>고객 지원: 문의 시 입력한 이메일, 회사명, 메시지 내용</li>
      <li>자동 수집: 접속 IP, 브라우저 종류, 쿠키, 접속 로그 (서비스 안정성·부정 이용 차단 목적)</li>
    </ul>

    <h2>2. 이용 목적</h2>
    <ul>
      <li>회원 식별 및 자체 제작 디지털 콘텐츠 제공</li>
      <li>결제 처리, 환불, 영수증 발송</li>
      <li>주문 진행 및 회사와 구매자 간 소통 지원</li>
      <li>법령 준수 및 분쟁 대응</li>
    </ul>

    <h2>3. 미성년자 개인정보 보호</h2>
    <p>
      회사는 <strong>만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.</strong> 만 14세 미만 아동의 가입 시도가 확인될 경우 즉시 계정을 삭제하고 관련 데이터를 파기합니다. 보호자가 자녀의 개인정보 수집 사실을 인지한 경우 <a href="mailto:junghanglee@gmail.com">junghanglee@gmail.com</a>으로 삭제를 요청할 수 있습니다.
    </p>

    <h2>4. 보유 및 파기</h2>
    <p>
      회원 탈퇴 즉시 개인정보를 파기합니다. 단, 전자상거래법 등 관련 법령에 따라 결제·계약 관련 기록은 최대 5년간 보관합니다.
    </p>

    <h2>5. 제3자 제공 및 처리 위탁</h2>
    <p>
      회사는 이용자 동의 또는 법령에 따른 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다. 서비스 운영을 위해 다음 업체에 일부 처리 업무를 위탁합니다:
    </p>
    <ul>
      <li><strong>Paddle.com Market Limited</strong> (영국, Merchant of Record) — 글로벌 결제, 송금, 세무 처리</li>
      <li><strong>Supabase, Inc.</strong> (미국) / <strong>Google Cloud Platform</strong> — 데이터베이스, 인증, 파일 저장</li>
    </ul>

    <h2>6. 개인정보의 국외 이전</h2>
    <p>
      서비스는 글로벌 인프라(Paddle, Supabase, Google Cloud)를 활용하므로 이용자의 개인정보가 <strong>대한민국 외 국가(영국, 미국, EU, 아시아 리전 등)로 이전·저장·처리될 수 있습니다.</strong> 회원가입 및 결제 진행 시 이용자는 이러한 국외 이전에 동의한 것으로 간주됩니다. 위탁 업체는 모두 SOC 2 / ISO 27001 / GDPR 등 국제 보안·개인정보 보호 표준을 준수하며, 이전되는 개인정보 항목은 본 방침 제1조에 명시된 항목으로 한정됩니다.
    </p>

    <h2>7. 쿠키(Cookie) 사용 정책</h2>
    <p>회사는 다음 목적을 위해 쿠키 및 유사 기술(localStorage 등)을 사용합니다:</p>
    <ul>
      <li><strong>필수 쿠키</strong>: 로그인 세션 유지, 보안 토큰 관리, 결제 처리 (비활성화 시 서비스 이용 불가)</li>
      <li><strong>기능 쿠키</strong>: 언어 설정, 환율 표시 등 사용자 환경 저장</li>
      <li><strong>분석 쿠키</strong>: 서비스 이용 패턴 분석 및 개선 (익명 처리)</li>
    </ul>
    <p>
      이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 일부 기능(로그인, 결제 등)이 제한될 수 있습니다.
    </p>

    <h2>8. 이용자의 권리</h2>
    <p>
      이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지·이전(데이터 이동권)을 요청할 수 있으며, 마이페이지에서 직접 처리하거나 <a href="mailto:junghanglee@gmail.com">junghanglee@gmail.com</a>로 요청할 수 있습니다. 회사는 요청 접수 후 영업일 기준 30일 이내 처리합니다.
    </p>

    <h2>9. 개인정보 보호 책임자</h2>
    <p>
      이름: 이정행 / 이메일: <a href="mailto:junghanglee@gmail.com">junghanglee@gmail.com</a>
    </p>

    <h2>10. 본 방침의 변경</h2>
    <p>
      본 개인정보처리방침은 법령·정책 또는 보안 기술의 변경에 따라 개정될 수 있습니다. 중요한 변경이 있을 경우 시행일 최소 7일 전에 서비스 내 공지 또는 가입 이메일로 사전 통지하며, 변경 이력은 본 페이지 상단의 시행일을 통해 확인할 수 있습니다.
    </p>
  </LegalLayout>
);

export default PrivacyPage;
