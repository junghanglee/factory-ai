export interface ProjectFile {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  orderNumber: string;
  serviceTitle: string;
  packageName: string;
  customer: string;
  customerId: string;
  status: "대기" | "작업중" | "검수중" | "수정요청" | "완료" | "취소";
  confirmStatus: "대기" | "컨펌됨" | "수정요청" | "-";
  price: number;
  orderDate: string;
  dueDate: string;
  completedDate?: string;
  files: ProjectFile[];
  notes: string;
}

export const projects: Project[] = [
  {
    id: "p1",
    orderNumber: "#1284",
    serviceTitle: "AI 고퀄리티 로고 디자인 3종 제작",
    packageName: "Standard",
    customer: "김민수",
    customerId: "m1",
    status: "작업중",
    confirmStatus: "-",
    price: 89000,
    orderDate: "2024-03-28",
    dueDate: "2024-04-04",
    files: [],
    notes: "미니멀 스타일 선호, 블루 계열 요청",
  },
  {
    id: "p2",
    orderNumber: "#1283",
    serviceTitle: "AI 숏폼 영상 제작 (릴스/틱톡)",
    packageName: "Premium",
    customer: "이지은",
    customerId: "m2",
    status: "검수중",
    confirmStatus: "대기",
    price: 199000,
    orderDate: "2024-03-25",
    dueDate: "2024-04-02",
    files: [
      { name: "숏폼_v1.mp4", url: "#", uploadedAt: "2024-04-01" },
      { name: "숏폼_v2.mp4", url: "#", uploadedAt: "2024-04-01" },
    ],
    notes: "화장품 브랜드 홍보용",
  },
  {
    id: "p3",
    orderNumber: "#1282",
    serviceTitle: "AI 블로그 글 작성 (SEO 최적화)",
    packageName: "Standard",
    customer: "박준영",
    customerId: "m3",
    status: "완료",
    confirmStatus: "컨펌됨",
    price: 49000,
    orderDate: "2024-03-15",
    dueDate: "2024-03-22",
    completedDate: "2024-03-20",
    files: [
      { name: "블로그_1.docx", url: "#", uploadedAt: "2024-03-19" },
      { name: "블로그_2.docx", url: "#", uploadedAt: "2024-03-19" },
      { name: "블로그_3.docx", url: "#", uploadedAt: "2024-03-20" },
    ],
    notes: "IT 관련 키워드 3개",
  },
  {
    id: "p4",
    orderNumber: "#1281",
    serviceTitle: "AI 퍼포먼스 광고 소재 10종 제작",
    packageName: "Basic",
    customer: "최서연",
    customerId: "m4",
    status: "작업중",
    confirmStatus: "-",
    price: 59000,
    orderDate: "2024-03-30",
    dueDate: "2024-04-05",
    files: [],
    notes: "인스타그램 광고용, 화이트 톤",
  },
  {
    id: "p5",
    orderNumber: "#1280",
    serviceTitle: "맞춤형 AI 챗봇 구축",
    packageName: "Basic",
    customer: "정도현",
    customerId: "m5",
    status: "대기",
    confirmStatus: "-",
    price: 199000,
    orderDate: "2024-04-02",
    dueDate: "2024-04-12",
    files: [],
    notes: "쇼핑몰 고객응대용",
  },
];
