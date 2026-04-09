export interface Service {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
  seller: string;
  tags: string[];
}

export const services: Service[] = [
  {
    id: "s1",
    categoryId: "ai-image",
    title: "AI 고퀄리티 로고 디자인 3종 제작",
    description: "브랜드 아이덴티티에 맞는 AI 로고 3종을 빠르게 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=300&fit=crop",
    price: 49000,
    originalPrice: 100000,
    rating: 4.9,
    reviewCount: 342,
    deliveryDays: 1,
    seller: "AI디자인랩",
    tags: ["로고", "브랜딩", "인기"],
  },
  {
    id: "s2",
    categoryId: "ai-image",
    title: "상세페이지 AI 디자인 (모바일 최적화)",
    description: "쇼핑몰 상세페이지를 AI로 빠르고 저렴하게 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    price: 79000,
    originalPrice: 150000,
    rating: 4.8,
    reviewCount: 218,
    deliveryDays: 2,
    seller: "콘텐츠팩토리",
    tags: ["상세페이지", "쇼핑몰"],
  },
  {
    id: "s3",
    categoryId: "ai-video",
    title: "AI 숏폼 영상 제작 (릴스/틱톡)",
    description: "SNS 최적화 숏폼 영상을 AI로 대량 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
    price: 39000,
    originalPrice: 80000,
    rating: 4.7,
    reviewCount: 156,
    deliveryDays: 1,
    seller: "무브스튜디오",
    tags: ["숏폼", "SNS", "릴스"],
  },
  {
    id: "s4",
    categoryId: "ai-writing",
    title: "AI 블로그 글 작성 (SEO 최적화)",
    description: "키워드 기반 SEO 최적화 블로그 포스트를 작성합니다.",
    thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
    price: 19000,
    originalPrice: 40000,
    rating: 4.6,
    reviewCount: 489,
    deliveryDays: 1,
    seller: "글로벌라이터",
    tags: ["블로그", "SEO", "마케팅"],
  },
  {
    id: "s5",
    categoryId: "ai-music",
    title: "AI 배경음악 & 효과음 제작",
    description: "영상에 딱 맞는 로열티 프리 배경음악을 AI로 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop",
    price: 29000,
    originalPrice: 60000,
    rating: 4.8,
    reviewCount: 87,
    deliveryDays: 1,
    seller: "사운드AI",
    tags: ["음악", "효과음", "배경음악"],
  },
  {
    id: "s6",
    categoryId: "ai-ads",
    title: "AI 퍼포먼스 광고 소재 10종 제작",
    description: "메타, 구글 광고에 최적화된 광고 이미지를 대량 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    price: 59000,
    originalPrice: 120000,
    rating: 4.9,
    reviewCount: 201,
    deliveryDays: 2,
    seller: "애드팩토리",
    tags: ["광고", "퍼포먼스", "대량생산"],
  },
  {
    id: "s7",
    categoryId: "ai-assistant",
    title: "맞춤형 AI 챗봇 구축",
    description: "고객 응대용 AI 챗봇을 맞춤 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1531746790095-e5a6e6e96b01?w=400&h=300&fit=crop",
    price: 199000,
    originalPrice: 400000,
    rating: 4.7,
    reviewCount: 64,
    deliveryDays: 5,
    seller: "봇빌더스",
    tags: ["챗봇", "자동화", "AI비서"],
  },
  {
    id: "s8",
    categoryId: "ai-webtoon",
    title: "AI 웹툰 1화 제작 (풀컬러)",
    description: "AI 기술로 빠르고 저렴하게 웹툰을 제작합니다.",
    thumbnail: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=300&fit=crop",
    price: 149000,
    originalPrice: 300000,
    rating: 4.5,
    reviewCount: 38,
    deliveryDays: 3,
    seller: "웹툰AI",
    tags: ["웹툰", "일러스트", "만화"],
  },
];

export const popularKeywords = [
  "로고 디자인", "숏폼 영상", "상세페이지", "블로그 글", "광고 소재",
  "AI 챗봇", "배경음악", "웹툰", "SNS 콘텐츠", "모션그래픽",
];
