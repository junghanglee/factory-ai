import { Zap, Shield, Clock, Layers } from "lucide-react";

const usps = [
  {
    icon: Zap,
    title: "에이전시 반값",
    description: "AI 기술로 제작 비용을 획기적으로 절감",
  },
  {
    icon: Shield,
    title: "높은 퀄리티",
    description: "전문가 감수를 거친 고품질 결과물 보장",
  },
  {
    icon: Clock,
    title: "빠른 납기",
    description: "기존 대비 3~5배 빠르게 납품",
  },
  {
    icon: Layers,
    title: "대량생산 가능",
    description: "균일한 퀄리티로 수백 개 제작",
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
