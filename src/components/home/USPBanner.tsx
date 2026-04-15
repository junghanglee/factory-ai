import { Zap, Shield, Clock, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

const USPBanner = () => {
  const { t } = useTranslation();

  const usps = [
    { icon: Zap, title: t("usp.cost"), description: t("usp.costDesc") },
    { icon: Shield, title: t("usp.quality"), description: t("usp.qualityDesc") },
    { icon: Clock, title: t("usp.speed"), description: t("usp.speedDesc") },
    { icon: Layers, title: t("usp.mass"), description: t("usp.massDesc") },
  ];

  return (
    <section className="bg-foreground">
      <div className="max-w-[1200px] mx-auto px-5 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {usps.map((usp) => (
            <div key={usp.title} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-background/10 flex items-center justify-center mx-auto mb-3">
                <usp.icon className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-[16px] font-bold text-background mb-1">{usp.title}</h3>
              <p className="text-[13px] text-background/60 leading-relaxed">{usp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USPBanner;
