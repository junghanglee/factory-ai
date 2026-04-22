import LegalLayout from "./LegalLayout";

const RefundPolicyPage = () => (
  <LegalLayout
    title="환불 정책 (Refund Policy)"
    intro="LINKTO Factory에서 구매하신 회사 자체 제작 디지털 콘텐츠에 대한 환불 기준입니다. 본 정책은 Paddle.com Market Limited를 통한 모든 결제에 적용되며, 환불 관련 문의는 linktoclaw@gmail.com으로 연락 주시기 바랍니다."
  >
    <h2>1. 환불 신청 가능 기간</h2>
    <p>
      이용자는 <strong>결제일로부터 14일 이내</strong>에 본 정책에 따라 환불을 신청할 수 있습니다. 단, 디지털 콘텐츠 특성상 아래 제2조의 기준에 따라 실제 환불 가능 금액이 결정됩니다.
    </p>

    <h2>2. 환불 가능 기본 원칙</h2>
    <ul>
      <li><strong>작업 미착수</strong> — 결제 후 회사가 콘텐츠 제작을 시작하기 전이라면 결제 금액 100%를 환불해 드립니다.</li>
      <li><strong>작업 부분 진행</strong> — 회사가 일부 작업을 진행한 경우, 잔여 미진행 비율만큼 안분(按分) 환불합니다.</li>
      <li><strong>작업 완료 및 인도 완료</strong> — 결과물이 정상 인도된 이후에는 디지털 콘텐츠의 특성상 원칙적으로 환불이 불가하며(전자상거래법 제17조 제2항 제5호), 결과물의 결함·약속과의 명백한 불일치가 있는 경우 재작업 또는 부분 환불로 처리합니다.</li>
    </ul>

    <h2>3. 자동 환불 (즉시)</h2>
    <ul>
      <li>중복 결제, 시스템 오류로 인한 오결제</li>
      <li>결제는 완료되었으나 주문이 생성되지 않은 경우</li>
    </ul>

    <h2>4. 환불 신청 방법</h2>
    <ol>
      <li>마이페이지 → 주문 내역에서 해당 주문 선택</li>
      <li>"환불 요청" 버튼을 누르거나 채팅창에서 사유와 함께 요청</li>
      <li>또는 <a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>으로 주문번호와 함께 요청</li>
    </ol>

    <h2>5. 환불 처리 기간</h2>
    <p>
      회사 검토 후 영업일 기준 1~3일 이내에 Paddle을 통해 환불이 시작되며, 카드사·은행에 따라 영수자 계좌에 반영되기까지 5~10영업일이 소요될 수 있습니다.
    </p>

    <h2>6. 환불이 제한되는 경우</h2>
    <ul>
      <li>구매자의 단순 변심으로 회사가 이미 콘텐츠 제작을 완료한 경우 (전자상거래법 제17조 제2항 제5호 — 디지털 콘텐츠의 인도 완료 후 청약철회 제한)</li>
      <li>구매자 귀책으로 작업이 진행될 수 없게 된 경우 (자료 미제공 등)</li>
      <li>약관에서 금지된 콘텐츠를 요청한 경우</li>
      <li>결제일로부터 14일이 경과한 경우 (단, 결과물 결함의 경우는 예외)</li>
    </ul>

    <h2>7. EU 소비자 보호법 안내</h2>
    <p>
      EU 거주 소비자에게는 원칙적으로 14일의 청약철회권(Right of Withdrawal)이 보장됩니다. 다만 EU Consumer Rights Directive(2011/83/EU) 제16조(m)에 따라 <strong>이용자가 명시적으로 동의하고 디지털 콘텐츠의 인도가 시작된 경우 청약철회권이 소멸</strong>됩니다. 결제 시 이러한 동의가 함께 처리되며, 자세한 사항은 결제 화면 및 Paddle 영수증을 참고하세요.
    </p>

    <h2>8. 분쟁 해결</h2>
    <p>
      환불 협의가 어려울 경우 회사 고객센터(<a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>)에서 직접 처리하며, 결제 분쟁이 카드사로 직접 제기될 경우 Paddle의 분쟁 절차(Dispute Resolution)에 따릅니다.
    </p>
  </LegalLayout>
);

export default RefundPolicyPage;
