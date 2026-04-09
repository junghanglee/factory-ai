import { Plus, Edit, Trash2, Eye } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const AdminServices = () => {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" /> 새 서비스 등록</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">서비스</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">카테고리</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">가격</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">평점</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">리뷰</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={service.thumbnail} alt="" className="w-12 h-9 rounded object-cover" />
                        <span className="font-medium truncate max-w-[200px]">{service.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{service.categoryId}</td>
                    <td className="p-4">{formatPrice(service.price)}원</td>
                    <td className="p-4">{service.rating}</td>
                    <td className="p-4">{service.reviewCount}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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

export default AdminServices;
