import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/data/services";
import { useTranslation } from "react-i18next";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const OrderPage = () => {
  const service = services[0];
  const packagePrice = Math.round(service.price * 1.8);
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">{t("order.title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Order summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("order.summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img src={service.thumbnail} alt="" className="w-24 h-18 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-sm">{service.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("order.standardPackage")}</p>
                    <p className="text-sm text-muted-foreground">{t("order.deliveryAndRevisions", { days: 5, revisions: 3 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("order.requirements")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("order.projectTitle")}</label>
                  <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t("order.projectTitlePlaceholder")} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("order.detailedReqs")}</label>
                  <textarea className="w-full h-32 px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t("order.detailedReqsPlaceholder")} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("order.attachFiles")}</label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
                    {t("order.dragUpload")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("order.paymentInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("order.cardNumber")}</label>
                    <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0000-0000-0000-0000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("order.expiry")}</label>
                    <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="MM/YY" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price summary sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">{t("order.paymentAmount")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("order.serviceAmount")}</span>
                  <span>{formatPrice(packagePrice)}{t("common.won")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("order.discount")}</span>
                  <span className="text-destructive">-0{t("common.won")}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>{t("order.totalAmount")}</span>
                  <span className="text-primary">{formatPrice(packagePrice)}{t("common.won")}</span>
                </div>
                <Button className="w-full mt-4">{t("order.pay")}</Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("order.paymentNote")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderPage;
