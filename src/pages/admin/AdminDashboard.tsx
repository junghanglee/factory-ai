import { TrendingUp, ShoppingCart, FolderKanban, DollarSign, Users, BarChart3 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "이번 달 매출", value: "₩12,450,000", change: "+23%", icon: DollarSign, color: "hsl(246, 65%, 56%)" },
  { label: "총 주문 수", value: "284", change: "+12%", icon: ShoppingCart, color: "hsl(210, 100%, 56%)" },
  { label: "진행중 프로젝트", value: "47", change: "+5", icon: FolderKanban, color: "hsl(30, 90%, 55%)" },
  { label: "활성 고객", value: "1,203", change: "+8%", icon: Users, color: "hsl(160, 70%, 42%)" },
];

const recentOrders = [
  { id: "#1284", title: "AI 로고 디자인 3종", customer: "김민수", amount: "₩88,200", status: "작업중" },
  { id: "#1283", title: "숏폼 영상 5편", customer: "이지은", amount: "₩195,000", status: "검수중" },
  { id: "#1282", title: "블로그 10편 작성", customer: "박준영", amount: "₩190,000", status: "완료" },
  { id: "#1281", title: "광고 소재 10종", customer: "최서연", amount: "₩59,000", status: "작업중" },
  { id: "#1280", title: "AI 챗봇 구축", customer: "정도현", amount: "₩199,000", status: "대기" },
];

const statusColors: Record<string, string> = {
  "작업중": "bg-blue-100 text-blue-700",
  "검수중": "bg-amber-100 text-amber-700",
  "완료": "bg-green-100 text-green-700",
  "대기": "bg-secondary text-muted-foreground",
};

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 주문</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-muted-foreground">주문번호</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">서비스</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">고객</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">금액</th>
                  <th className="text-left py-3 font-medium text-muted-foreground">상태</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{order.id}</td>
                    <td className="py-3">{order.title}</td>
                    <td className="py-3 text-muted-foreground">{order.customer}</td>
                    <td className="py-3">{order.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
