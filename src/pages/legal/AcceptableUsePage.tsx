import LegalLayout from "./LegalLayout";

const AcceptableUsePage = () => (
  <LegalLayout
    title="서비스 이용 정책 (Acceptable Use Policy)"
    intro="LINKTO Factory에서 등록·거래·요청할 수 없는 콘텐츠와 행위를 명시합니다. 본 정책 위반 시 게시물 삭제, 거래 취소, 계정 정지가 적용될 수 있습니다."
  >
    <h2>1. 금지 콘텐츠</h2>
    <ul>
      <li>음란물, 노골적인 성적 콘텐츠, 아동 관련 부적절한 콘텐츠</li>
      <li>저작권·상표권·초상권을 침해하는 콘텐츠</li>
      <li>도박, 불법 약물, 무기, 금융 사기와 관련된 콘텐츠</li>
      <li>특정 인종·종교·성별·국적에 대한 혐오 또는 차별을 조장하는 콘텐츠</li>
      <li>타인의 개인정보·민감정보가 포함된 자료</li>
    </ul>

    <h2>2. 금지 행위</h2>
    <ul>
      <li>허위 리뷰 작성, 평점 조작</li>
      <li>결제 우회, 가짜 환불 청구, 결제 사기</li>
      <li>서비스 외부 결제 유도 (예: 직거래 강요)</li>
      <li>크롤링·자동화 봇을 통한 비정상 접근</li>
    </ul>

    <h2>3. 신고 및 처리</h2>
    <p>
      위반 사항을 발견하면 <a href="mailto:linktoclaw@gmail.com">linktoclaw@gmail.com</a>로 신고해 주세요. 회사는 24시간 이내 검토를 시작하며, 사실 확인 시 콘텐츠 삭제·계정 정지·환불·법적 조치를 취합니다.
    </p>
  </LegalLayout>
);

export default AcceptableUsePage;
