import { Zap, Shield, Clock, Layers } from "lucide-react";

const usps = [
  {
    icon: Zap,
    title: "에이전시 반값",
    description: "AI 기술로 제작 비용을 획기적으로 절감합니다",
    color: "hsl(246, 65%, 56%)",
  },
  {
    icon: Shield,
    title: "높은 퀄리티",
    description: "전문가 감수를 거친 고품질 결과물을 보장합니다",
    color: "hsl(160, 70%, 42%)",
  },
  {
    icon: Clock,
    title: "빠른 납기",
    description: "AI 자동화로 기존 대비 3~5배 빠르게 납품합니다",
    color: "hsl(30, 90%, 55%)",
  },
  {
    icon: Layers,
    title: "대량생산 가능",
    description: "수백 개의 콘텐츠도 균일한 퀄리티로 제작합니다",
    color: "hsl(340, 75%, 55%)",
  },
];

const USPBanner = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
          왜 AI팩토리인가요?
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          AI 기술과 전문가의 노하우를 결합하여, 기존 에이전시 대비 반값으로 높은 퀄리티의 콘텐츠를 빠르게 제작합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {usps.map((usp) => (
            <div
              key={usp.title}
              className="relative p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${usp.color}15` }}
              >
                <usp.icon className="h-6 w-6" style={{ color: usp.color }} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{usp.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{usp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USPBanner;
