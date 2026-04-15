export interface ServicePackage {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface Service {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  detailedDescription: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
  seller: string;
  tags: string[];
  packages: ServicePackage[];
  portfolioImages: string[];
}

export const services: Service[] = [
  {
    id: "s1",
    categoryId: "ai-image",
    title: "AI 고퀄리티 로고 디자인 3종 제작",
    description: "브랜드 아이덴티티에 맞는 AI 로고 3종을 빠르게 제작합니다.",
    detailedDescription: "최신 AI 기술을 활용하여 브랜드 컨셉에 맞는 고퀄리티 로고 3종을 제작합니다. 다양한 스타일(미니멀, 모던, 클래식)로 제안드리며, 수정 요청도 빠르게 반영합니다.",
    thumbnail: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=300&fit=crop",
    price: 49000,
    originalPrice: 100000,
    rating: 4.9,
    reviewCount: 342,
    deliveryDays: 1,
    seller: "AI디자인랩",
    tags: ["로고", "브랜딩", "인기"],
    packages: [
      { name: "Basic", price: 49000, deliveryDays: 1, revisions: 1, features: ["로고 1종", "PNG 파일", "기본 컨셉"] },
      { name: "Standard", price: 89000, deliveryDays: 2, revisions: 3, features: ["로고 3종", "PNG+AI 파일", "컨셉 제안서", "명함 디자인"] },
      { name: "Premium", price: 149000, deliveryDays: 3, revisions: 5, features: ["로고 5종", "모든 파일 포맷", "브랜드 가이드", "명함+봉투+간판"] },
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
    ],
  },
  {
    id: "s2",
    categoryId: "ai-image",
    title: "상세페이지 AI 디자인 (모바일 최적화)",
    description: "쇼핑몰 상세페이지를 AI로 빠르고 저렴하게 제작합니다.",
    detailedDescription: "모바일 최적화된 쇼핑몰 상세페이지를 AI 기술로 제작합니다. 전환율 높은 레이아웃과 매력적인 비주얼로 매출 상승을 도와드립니다.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    price: 79000,
    originalPrice: 150000,
    rating: 4.8,
    reviewCount: 218,
    deliveryDays: 2,
    seller: "콘텐츠팩토리",
    tags: ["상세페이지", "쇼핑몰"],
    packages: [
      { name: "Basic", price: 79000, deliveryDays: 2, revisions: 1, features: ["상세페이지 1p", "모바일 최적화"] },
      { name: "Standard", price: 139000, deliveryDays: 3, revisions: 3, features: ["상세페이지 1p", "모바일+PC", "GIF 배너", "SEO 최적화"] },
      { name: "Premium", price: 239000, deliveryDays: 5, revisions: 5, features: ["상세페이지 2p", "모바일+PC", "영상 삽입", "A/B 테스트 버전"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s3",
    categoryId: "ai-video",
    title: "AI 숏폼 영상 제작 (릴스/틱톡)",
    description: "SNS 최적화 숏폼 영상을 AI로 대량 제작합니다.",
    detailedDescription: "인스타 릴스, 틱톡, 유튜브 숏츠에 최적화된 숏폼 영상을 AI로 빠르게 대량 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
    price: 39000,
    originalPrice: 80000,
    rating: 4.7,
    reviewCount: 156,
    deliveryDays: 1,
    seller: "무브스튜디오",
    tags: ["숏폼", "SNS", "릴스"],
    packages: [
      { name: "Basic", price: 39000, deliveryDays: 1, revisions: 1, features: ["숏폼 1편 (30초)", "자막 포함"] },
      { name: "Standard", price: 99000, deliveryDays: 2, revisions: 2, features: ["숏폼 3편", "자막+효과음", "썸네일"] },
      { name: "Premium", price: 199000, deliveryDays: 3, revisions: 3, features: ["숏폼 5편", "풀 편집", "BGM+효과음", "SNS 최적화"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s4",
    categoryId: "ai-writing",
    title: "AI 블로그 글 작성 (SEO 최적화)",
    description: "키워드 기반 SEO 최적화 블로그 포스트를 작성합니다.",
    detailedDescription: "검색엔진 최적화(SEO)에 특화된 블로그 포스트를 AI로 작성합니다. 키워드 분석부터 글 구조, 내부링크 전략까지 포함합니다.",
    thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
    price: 19000,
    originalPrice: 40000,
    rating: 4.6,
    reviewCount: 489,
    deliveryDays: 1,
    seller: "글로벌라이터",
    tags: ["블로그", "SEO", "마케팅"],
    packages: [
      { name: "Basic", price: 19000, deliveryDays: 1, revisions: 1, features: ["블로그 1편 (1000자)", "SEO 키워드 1개"] },
      { name: "Standard", price: 49000, deliveryDays: 2, revisions: 2, features: ["블로그 3편", "SEO 키워드 분석", "이미지 포함"] },
      { name: "Premium", price: 99000, deliveryDays: 3, revisions: 3, features: ["블로그 5편", "키워드 전략 보고서", "이미지+인포그래픽"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s5",
    categoryId: "ai-music",
    title: "AI 배경음악 & 효과음 제작",
    description: "영상에 딱 맞는 로열티 프리 배경음악을 AI로 제작합니다.",
    detailedDescription: "AI 기술로 영상 분위기에 맞는 로열티 프리 배경음악과 효과음을 제작합니다. 상업적 이용 가능합니다.",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop",
    price: 29000,
    originalPrice: 60000,
    rating: 4.8,
    reviewCount: 87,
    deliveryDays: 1,
    seller: "사운드AI",
    tags: ["음악", "효과음", "배경음악"],
    packages: [
      { name: "Basic", price: 29000, deliveryDays: 1, revisions: 1, features: ["배경음악 1곡 (60초)", "WAV 파일"] },
      { name: "Standard", price: 59000, deliveryDays: 2, revisions: 2, features: ["배경음악 2곡", "효과음 5개", "WAV+MP3"] },
      { name: "Premium", price: 119000, deliveryDays: 3, revisions: 3, features: ["배경음악 3곡", "효과음 10개", "맞춤 편곡", "모든 포맷"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s6",
    categoryId: "ai-ads",
    title: "AI 퍼포먼스 광고 소재 10종 제작",
    description: "메타, 구글 광고에 최적화된 광고 이미지를 대량 제작합니다.",
    detailedDescription: "메타(페이스북/인스타), 구글 광고에 최적화된 퍼포먼스 광고 소재를 AI로 대량 제작합니다. A/B 테스트에 활용 가능한 다양한 버전을 제공합니다.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    price: 59000,
    originalPrice: 120000,
    rating: 4.9,
    reviewCount: 201,
    deliveryDays: 2,
    seller: "애드팩토리",
    tags: ["광고", "퍼포먼스", "대량생산"],
    packages: [
      { name: "Basic", price: 59000, deliveryDays: 2, revisions: 1, features: ["광고 소재 5종", "1080x1080"] },
      { name: "Standard", price: 99000, deliveryDays: 3, revisions: 2, features: ["광고 소재 10종", "3가지 사이즈", "카피라이팅"] },
      { name: "Premium", price: 179000, deliveryDays: 5, revisions: 3, features: ["광고 소재 20종", "5가지 사이즈", "카피+A/B 테스트 가이드"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s7",
    categoryId: "ai-assistant",
    title: "맞춤형 AI 챗봇 구축",
    description: "고객 응대용 AI 챗봇을 맞춤 제작합니다.",
    detailedDescription: "고객 응대, FAQ 자동화, 예약 관리 등을 위한 맞춤형 AI 챗봇을 구축합니다. 카카오톡, 웹사이트 등 다양한 채널에 연동 가능합니다.",
    thumbnail: "https://images.unsplash.com/photo-1531746790095-e5a6e6e96b01?w=400&h=300&fit=crop",
    price: 199000,
    originalPrice: 400000,
    rating: 4.7,
    reviewCount: 64,
    deliveryDays: 5,
    seller: "봇빌더스",
    tags: ["챗봇", "자동화", "AI비서"],
    packages: [
      { name: "Basic", price: 199000, deliveryDays: 5, revisions: 2, features: ["기본 챗봇", "FAQ 20개", "웹 위젯"] },
      { name: "Standard", price: 399000, deliveryDays: 7, revisions: 3, features: ["고급 챗봇", "FAQ 50개", "카카오톡 연동", "관리자 대시보드"] },
      { name: "Premium", price: 699000, deliveryDays: 14, revisions: 5, features: ["맞춤형 AI", "무제한 FAQ", "멀티 채널", "분석 리포트", "유지보수 1개월"] },
    ],
    portfolioImages: [],
  },
  {
    id: "s8",
    categoryId: "ai-webtoon",
    title: "AI 웹툰 1화 제작 (풀컬러)",
    description: "AI 기술로 빠르고 저렴하게 웹툰을 제작합니다.",
    detailedDescription: "AI 기술을 활용하여 풀컬러 웹툰을 빠르고 저렴하게 제작합니다. 스토리 기획부터 작화, 채색까지 원스톱으로 진행합니다.",
    thumbnail: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=300&fit=crop",
    price: 149000,
    originalPrice: 300000,
    rating: 4.5,
    reviewCount: 38,
    deliveryDays: 3,
    seller: "웹툰AI",
    tags: ["웹툰", "일러스트", "만화"],
    packages: [
      { name: "Basic", price: 149000, deliveryDays: 3, revisions: 1, features: ["웹툰 1화 (10컷)", "풀컬러", "기본 배경"] },
      { name: "Standard", price: 299000, deliveryDays: 5, revisions: 2, features: ["웹툰 1화 (20컷)", "풀컬러", "배경+효과", "스토리 기획"] },
      { name: "Premium", price: 499000, deliveryDays: 7, revisions: 3, features: ["웹툰 2화", "풀컬러", "고퀄 배경", "스토리+콘티", "SNS 홍보 컷"] },
    ],
    portfolioImages: [],
  },
];

export const popularKeywords = [
  "AI에이전트", "AI광고", "AI웹툰", "웹/앱개발", "미니게임", "유투브 SEED",
];
