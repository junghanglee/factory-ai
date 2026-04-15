import { Zap, Shield, Clock, Layers } from "lucide-react";

const usps = [
  {
    icon: Zap,
    title: "에이전시 반값수준의 비용",
    description: "해외생산기지 설립으로 압도적가성비",
  },
  {
    icon: Shield,
    title: "높은 퀄리티",
    description: "한국인 관리자가 높은 기준으로 QC",
  },
  {
    icon: Clock,
    title: "빠른 납기/수정",
    description: "전담자 배정을 통해 빠른 업무처리",
  },
  {
    icon: Layers,
    title: "대량생산 가능",
    description: "균일한 퀄리티로 대량생산(계약)가능",
  },
];

const USPBanner = () => {
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
