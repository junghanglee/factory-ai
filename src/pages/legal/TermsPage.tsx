import LegalLayout from "./LegalLayout";
import EnglishSummary from "@/components/legal/EnglishSummary";

const TermsPage = () => (
  <LegalLayout
    title="이용약관 (Terms of Service)"
    intro="본 약관은 링크투홀딩스(주)(이하 '회사')가 운영하는 LINKTO Factory(linktofactory.com, 이하 '서비스')의 이용 조건과 책임을 규정합니다. 본 약관 관련 문의는 linktoclaw@gmail.com으로 연락 주시기 바랍니다."
  >
    <EnglishSummary summary="These Terms of Service govern the use of LINKTO Factory. Key points: (1) we are a first-party digital content store, NOT a third-party marketplace; (2) all sales are processed in USD by Paddle.com Market Limited (UK) as Merchant of Record; (3) digital content is delivered electronically — standard items are delivered immediately, custom items within 3–14 business days; (4) refunds follow our Refund Policy; (5) governing law: Republic of Korea. Contact: linktoclaw@gmail.com." />
    <h2>1. 서비스 개요</h2>
    <p>
      서비스는 회사가 자체적으로 기획·제작하는 AI 기반 디지털 콘텐츠(이미지, 영상, 글, 음악, AI 비서, 웹툰/미니게임, 광고 콘텐츠 등)를 직접 판매하는 디지털 콘텐츠 스토어입니다. <strong>링크투홀딩스(주)는 모든 콘텐츠를 직접 제작·판매하는 판매자(First-party Seller)이며, 제3자 셀러의 콘텐츠 판매를 중개하는 마켓플레이스(Marketplace)가 아닙니다.</strong> 모든 콘텐츠와 결과물의 품질·납기·저작권에 대한 책임은 전적으로 회사에 있습니다.
    </p>
    <p>
      결제는 글로벌 결제대행사 Paddle.com Market Limited를 통해 미국 달러(USD) 기준으로 처리되며, Paddle이 본 거래의 등록 판매자(Merchant of Record)로서 영수증 발행, 부가세 처리, 결제 분쟁 처리를 수행합니다.
    </p>

    <h2>2. 계정 및 이용 자격</h2>
    <ul>
      <li>이용자는 회원가입 시 정확한 정보를 제공해야 하며, 만 14세 미만은 가입할 수 없습니다.</li>
      <li>회사는 결제 사기·도용·정책 위반이 의심되는 계정을 사전 통지 없이 정지할 수 있습니다.</li>
    </ul>

    <h2>3. 주문 및 결제</h2>
    <ul>
      <li>모든 결제는 Paddle.com Market Limited를 통한 전자상거래로 진행되며, 영수증과 세금계산은 Paddle이 발행합니다.</li>
      <li>표시 가격은 USD 기준이며, 한국 원화는 결제 시점 환율에 따른 참고 환산 금액입니다.</li>
      <li>결제 완료 후 작업 일정과 진행 상황은 채팅을 통해 회사가 직접 안내합니다.</li>
    </ul>

    <h2>4. 디지털 콘텐츠의 인도(Delivery)</h2>
    <ul>
      <li>본 서비스의 모든 상품은 <strong>다운로드 또는 온라인 전송 방식으로 제공되는 디지털 콘텐츠</strong>이며, 물리적 배송은 발생하지 않습니다.</li>
      <li>주문 즉시 제공 가능한 표준 콘텐츠: 결제 완료 직후 회원 마이페이지·이메일·채팅을 통해 자동 인도됩니다.</li>
      <li>맞춤 제작 콘텐츠: 결제 완료 후 회사 제작팀이 작업에 착수하며, 일반적으로 영업일 기준 <strong>3~14일 이내</strong>에 채팅 및 이메일을 통해 결과물을 인도합니다. 정확한 납기는 상품 상세 페이지 및 주문 확정 시 채팅으로 개별 안내됩니다.</li>
      <li>인도 지연이 예상될 경우 회사는 사전에 구매자에게 통지합니다.</li>
    </ul>

    <h2>5. 금지 행위</h2>
    <p>
      회사는 다음과 같은 콘텐츠의 주문·요청을 금지합니다: 성인 콘텐츠, 저작권/상표권 침해물, 불법 도박·금융·약품 관련물, 타인의 개인정보가 포함된 자료, 악성 코드 또는 보안 위협이 되는 자료. 자세한 내용은 <a href="/acceptable-use">서비스 이용 정책</a>을 참고하세요.
    </p>

    <h2>6. 환불 및 분쟁</h2>
    <p>
      환불은 별도 <a href="/refund-policy">환불 정책</a>에 따릅니다. 분쟁이 발생한 경우 회사 고객센터(<a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>)로 먼저 접수하며, 협의가 어려울 경우 대한민국 법령 및 회사 본사 소재지 관할 법원의 결정에 따릅니다.
    </p>

    <h2>7. 책임의 제한</h2>
    <p>
      회사가 직접 제작·제공하는 디지털 콘텐츠의 품질·납기에 대해 회사가 직접 책임을 부담합니다. 결과물에 결함이 있거나 약속한 사양과 다른 경우 재작업 또는 환불을 통해 신속히 해결합니다.
    </p>

    <h2>8. 약관의 변경</h2>
    <p>
      회사는 관련 법령 및 정책에 따라 본 약관을 변경할 수 있으며, 변경 시 시행일 최소 7일 전(이용자에게 불리한 변경의 경우 30일 전)에 서비스 내 공지 또는 가입 이메일로 사전 통지합니다. 변경 후 서비스 계속 이용 시 변경된 약관에 동의한 것으로 간주합니다.
    </p>

    <h2>9. 고객 지원</h2>
    <p>
      서비스 이용 중 문의 사항은 <a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a> 또는 마이페이지 채팅을 통해 접수해 주시면 영업일 기준 24시간 이내 회신해 드립니다.
    </p>
  </LegalLayout>
);

export default TermsPage;
