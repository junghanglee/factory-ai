import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, FolderKanban, Users } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const formatPrice = (n: number) => "₩" + n.toLocaleString("ko-KR");

const statusColors: Record<string, string> = {
  "작업중": "bg-blue-100 text-blue-700",
  "검수중": "bg-amber-100 text-amber-700",
  "완료": "bg-green-100 text-green-700",
  "대기": "bg-secondary text-muted-foreground",
};

const AdminDashboard = () => {
  const { t } = useTranslation();

  const { data: projectStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [projectsRes, membersRes, settlementsRes] = await Promise.all([
        supabase.from("projects").select("id, status, price, payment_status"),
        supabase.from("members").select("id"),
        supabase.from("settlements").select("order_amount, status"),
      ]);
      const projects = projectsRes.data || [];
      const members = membersRes.data || [];
      const settlements = settlementsRes.data || [];

      const totalRevenue = settlements.reduce((s, r) => s + (r.order_amount || 0), 0);
      const inProgress = projects.filter(p => ["작업중", "검수중", "수정중"].includes(p.status)).length;

      return {
        totalRevenue,
        totalOrders: projects.length,
        inProgress,
        totalMembers: members.length,
      };
    },
    refetchInterval: 30000,
  });

  const { data: recentProjects = [] } = useQuery({
    queryKey: ["admin-recent-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, order_number, service_title, customer, price, status, payment_status, order_date")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const stats = [
    { label: t("admin.totalRevenue"), value: formatPrice(projectStats?.totalRevenue || 0), icon: DollarSign, color: "hsl(246, 65%, 56%)" },
    { label: t("admin.totalOrders"), value: String(projectStats?.totalOrders || 0), icon: ShoppingCart, color: "hsl(210, 100%, 56%)" },
    { label: t("admin.activeProjects"), value: String(projectStats?.inProgress || 0), icon: FolderKanban, color: "hsl(30, 90%, 55%)" },
    { label: t("admin.totalMembers"), value: String(projectStats?.totalMembers || 0), icon: Users, color: "hsl(160, 70%, 42%)" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{t("admin.dashboard")}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.recentProjects")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t("admin.noProjects")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.orderNumber")}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.service")}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.customer")}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.amount")}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.status")}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t("admin.payment")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProjects.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{p.order_number}</td>
                        <td className="py-3 max-w-[200px] truncate">{p.service_title}</td>
                        <td className="py-3 text-muted-foreground">{p.customer}</td>
                        <td className="py-3">{formatPrice(p.price)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || statusColors["대기"]}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">{p.payment_status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
