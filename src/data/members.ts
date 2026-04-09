export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: "활성" | "휴면" | "탈퇴";
  orderCount: number;
  totalSpent: number;
}

export const members: Member[] = [
  { id: "m1", name: "김민수", email: "minsu@example.com", phone: "010-1234-5678", joinDate: "2024-01-15", status: "활성", orderCount: 12, totalSpent: 1580000 },
  { id: "m2", name: "이지은", email: "jieun@example.com", phone: "010-2345-6789", joinDate: "2024-02-20", status: "활성", orderCount: 8, totalSpent: 920000 },
  { id: "m3", name: "박준영", email: "junyoung@example.com", phone: "010-3456-7890", joinDate: "2024-03-05", status: "활성", orderCount: 5, totalSpent: 450000 },
  { id: "m4", name: "최서연", email: "seoyeon@example.com", phone: "010-4567-8901", joinDate: "2024-03-18", status: "활성", orderCount: 3, totalSpent: 297000 },
  { id: "m5", name: "정도현", email: "dohyun@example.com", phone: "010-5678-9012", joinDate: "2024-04-01", status: "휴면", orderCount: 1, totalSpent: 49000 },
  { id: "m6", name: "한소희", email: "sohee@example.com", phone: "010-6789-0123", joinDate: "2024-01-22", status: "활성", orderCount: 15, totalSpent: 2340000 },
  { id: "m7", name: "윤재호", email: "jaeho@example.com", phone: "010-7890-1234", joinDate: "2024-02-10", status: "탈퇴", orderCount: 2, totalSpent: 128000 },
];
