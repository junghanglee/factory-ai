import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { DollarSign, Users, Zap, Globe, Film, Settings, Smartphone, GraduationCap, Handshake, MapPin, MessageCircle, Mail, Phone, ChevronDown, ArrowRight } from "lucide-react";
import aboutHero from "@/assets/about-hero.jpg";
import aboutStrengths from "@/assets/about-strengths.jpg";
import aboutServices from "@/assets/about-services.jpg";
import aboutAcademy from "@/assets/about-academy.jpg";

const tabs = [
  { id: "brand", label: "Brand Story" },
  { id: "strengths", label: "Core Strengths" },
  { id: "services", label: "Production Service" },
  { id: "academy", label: "AI Academy & B2B" },
  { id: "contact", label: "Contact Us" },
];

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("brand");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={aboutHero} alt="AI Factory Team" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-4 font-medium">About AI Factory</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            AI로 만드는<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">새로운 콘텐츠의 미래</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            호치민의 열정과 AI 기술의 만남,<br className="md:hidden" /> 당신의 콘텐츠 생산 기지
          </p>
          <button
            onClick={() => scrollToSection("brand")}
            className="animate-bounce mt-4"
          >
            <ChevronDown className="h-8 w-8 text-white/50" />
          </button>
        </div>
      </section>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Section 1: Brand Story */}
      <section
        ref={(el) => { sectionRefs.current["brand"] = el; }}
        className="py-24 md:py-32"
      >
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Brand Story</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">혁신의 시작</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              호치민의 열정과 AI 기술의 만남, 당신의 콘텐츠 생산 기지
            </p>
          </div>

          {/* Hook */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 md:p-12 mb-16 border border-primary/20">
            <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed text-center">
              아직도 콘텐츠 하나를 만들기 위해<br />
              <span className="text-primary font-bold">수천만 원의 비용</span>과 <span className="text-primary font-bold">수개월의 시간</span>을<br />
              낭비하고 계십니까?
            </p>
          </div>

          {/* Identity */}
          <div className="mb-16">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              AI 팩토리는 베트남 호치민에 본사를 둔 <strong className="text-foreground">'다국적 AI 크리에이티브 그룹'</strong>입니다.
              한국인 매니저의 섬세한 디렉팅과 글로벌 AI 전문가들의 기술력이 만나, 콘텐츠 제작의 새로운 표준을 만듭니다.
            </p>
          </div>

          {/* Mission */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">우리는 기술을 넘어 '가치'를 생산합니다</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "🎨", title: "Creative", desc: "AI 영상 제작자 및 콘텐츠 기획자의 감각" },
                { icon: "⚡", title: "Tech", desc: "AI 자동화 솔루션 개발자의 혁신적인 시스템" },
                { icon: "🌍", title: "Global", desc: "한국과 베트남을 잇는 독보적인 인적 인프라" },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-2xl p-8 text-center border border-border hover:border-primary/30 transition-colors">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing */}
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12" style={{ background: "linear-gradient(135deg, hsl(246,65%,56%), hsl(210,100%,56%))" }}>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed text-center">
              "비용은 낮추고, 속도는 높이며, 퀄리티는 타협하지 않습니다.<br />
              <span className="text-white/80">이것이 AI 팩토리가 정의하는 미래입니다."</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Core Strengths */}
      <section
        ref={(el) => { sectionRefs.current["strengths"] = el; }}
        className="relative py-24 md:py-32"
      >
        <img src={aboutStrengths} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={800} />
        <div className="absolute inset-0 bg-black/85" />
        <div className="relative z-10 max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-blue-400 font-semibold mb-3">Core Strengths</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">차별화 포인트</h2>
            <p className="text-white/60 text-lg">왜 수많은 기업이 국경을 넘어 AI 팩토리를 선택할까요?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: DollarSign, num: "01", title: "압도적 비용 경쟁력", sub: "Cost-Efficiency",
                desc: "베트남 호치민 기반의 인적 인프라를 활용하여 한국 대비 최대 60% 이상의 비용 절감 효과를 제공합니다. 똑같은 예산으로 3배 더 많은 콘텐츠를 생산하세요.",
              },
              {
                icon: Users, num: "02", title: "한국인 매니저의 Direct 케어", sub: "No-Barrier",
                desc: "해외 외주에서 겪는 소통의 갈등은 없습니다. 한국인 매니저가 상주하며 모든 프로젝트를 한국적 니즈와 감성에 맞게 철저히 필터링합니다.",
              },
              {
                icon: Zap, num: "03", title: "AI 기반 자동화 시스템", sub: "Speed-Tech",
                desc: "단순 노가다식 제작이 아닙니다. 자체 개발한 AI 자동화 솔루션을 통해 제작 기간을 획기적으로 단축하여 시장의 변화에 실시간으로 대응합니다.",
              },
              {
                icon: Globe, num: "04", title: "다국적 시너지", sub: "Global Insight",
                desc: "한국의 트렌드 기획력과 베트남의 역동적인 제작 역량이 만나 전 세계 어디에서도 통하는 '글로벌 스탠다드' 결과물을 만듭니다.",
              },
            ].map((item) => (
              <div key={item.num} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs text-blue-400 font-mono">Point {item.num}</span>
                    <h3 className="text-white font-bold text-lg">{item.title}</h3>
                  </div>
                </div>
                <span className="inline-block text-xs text-white/40 bg-white/5 rounded-full px-3 py-1 mb-4">{item.sub}</span>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-white font-bold text-lg text-center">기존 제작 방식 vs AI 팩토리 방식</h3>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <div className="p-4 border-r border-white/10 text-white/40 font-medium">항목</div>
              <div className="p-4 border-r border-white/10 text-white/60 text-center font-medium">기존 방식</div>
              <div className="p-4 text-blue-400 text-center font-bold">AI 팩토리</div>
              {[
                ["제작 비용", "1,000만원~", "300만원~"],
                ["제작 기간", "4~8주", "1~2주"],
                ["수정 횟수", "2~3회", "무제한"],
                ["콘텐츠 양", "1~2개", "5~10개"],
                ["소통 방식", "이메일/미팅", "전담 매니저 상시"],
              ].map(([label, old, factory]) => (
                <>
                  <div key={label} className="p-4 border-t border-r border-white/10 text-white/70">{label}</div>
                  <div className="p-4 border-t border-r border-white/10 text-white/40 text-center line-through">{old}</div>
                  <div className="p-4 border-t border-white/10 text-blue-400 text-center font-semibold">{factory}</div>
                </>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Production Service */}
      <section
        ref={(el) => { sectionRefs.current["services"] = el; }}
        className="py-24 md:py-32"
      >
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Production Service</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">제작 서비스 안내</h2>
            <p className="text-muted-foreground text-lg">상상하는 모든 것, AI가 현실로 그립니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Film, title: "AI 영상 제작", sub: "AI Vision",
                items: [
                  "실사형 AI 모델을 활용한 브랜드 광고 영상",
                  "고가의 세트장/로케이션 없이 구현하는 환상적인 비주얼 콘텐츠",
                  "바이럴 최적화 숏폼(Reels, TikTok, Shorts) 무한 생성",
                ],
              },
              {
                icon: Settings, title: "AI 자동화 솔루션", sub: "Automation",
                items: [
                  "매일 쏟아지는 마케팅 소재(배너, 카피) 자동 생성 툴 구축",
                  "고객사 맞춤형 AI 챗봇 및 업무 자동화 워크플로우 설계",
                ],
              },
              {
                icon: Smartphone, title: "디지털 마케팅", sub: "Growth",
                items: [
                  "베트남 및 글로벌 시장 진출을 위한 SNS 채널 운영 및 퍼포먼스 마케팅",
                  "AI 데이터 분석 기반의 정밀 타겟팅 광고 집행",
                ],
              },
            ].map((svc) => (
              <div key={svc.sub} className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <svc.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-1">{svc.title}</h3>
                <span className="text-xs text-muted-foreground font-mono mb-6 block">{svc.sub}</span>
                <ul className="space-y-3">
                  {svc.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Services bg image */}
          <div className="relative mt-16 rounded-2xl overflow-hidden h-[300px]">
            <img src={aboutServices} alt="Production Studio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={800} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
              <div className="p-8 md:p-12">
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">당신의 상상을 현실로</h3>
                <p className="text-white/60">최첨단 AI 기술과 크리에이티브의 완벽한 조합</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: AI Academy & B2B */}
      <section
        ref={(el) => { sectionRefs.current["academy"] = el; }}
        className="relative py-24 md:py-32 bg-secondary/50"
      >
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">AI Academy & B2B</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">교육 및 계약</h2>
            <p className="text-muted-foreground text-lg">기업의 근본적인 체질을 AI 중심으로 바꿉니다</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Academy */}
            <div className="relative rounded-2xl overflow-hidden">
              <img src={aboutAcademy} alt="AI Academy" className="w-full h-[240px] object-cover" loading="lazy" width={1920} height={800} />
              <div className="bg-card border border-border border-t-0 rounded-b-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">AI 아카데미</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">🎯 실전 중심 교육</h4>
                    <p className="text-sm text-muted-foreground">이론이 아닌, 현업에서 즉시 사용하는 AI 툴(Stable Diffusion, Midjourney, Veo 등) 실무 교육</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">🚀 전문가 양성</h4>
                    <p className="text-sm text-muted-foreground">기업 내부 인력을 AI 콘텐츠 전문가로 업그레이드하는 맞춤형 커리큘럼</p>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Handshake className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">B2B 파트너십 & 계약</h3>
              </div>
              <div className="space-y-6">
                {[
                  { title: "정기 구독형 서비스", desc: "매월 일정량의 콘텐츠를 고정비로 안정적으로 수급하는 '콘텐츠 정기 구독'" },
                  { title: "연간 계약 혜택", desc: "전담 팀 배치 및 AI 자동화 시스템 우선 구축 지원" },
                  { title: "전략적 제휴", desc: "귀사의 마케팅 팀 내부에 AI 팩토리의 엔진을 이식해 드립니다" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Contact Us */}
      <section
        ref={(el) => { sectionRefs.current["contact"] = el; }}
        className="py-24 md:py-32"
      >
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Contact Us</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">문의 및 상담</h2>
            <p className="text-muted-foreground text-lg">귀사의 성장을 가속화할 준비가 되셨나요?</p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-8 md:p-12 text-center mb-12">
            <p className="text-lg md:text-xl font-medium mb-6">
              "상담 신청만으로도 귀사의 현재 마케팅 효율을 진단해 드립니다."
            </p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, hsl(246,65%,56%), hsl(210,100%,56%))" }}
            >
              <MessageCircle className="h-5 w-5" />
              무료 상담 시작하기
            </a>
          </div>

          {/* Process */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-center mb-8">상담 프로세스</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "01", label: "문의 접수" },
                { step: "02", label: "한국인 매니저\n1:1 진단" },
                { step: "03", label: "AI 맞춤\n전략 제안" },
                { step: "04", label: "프로젝트 착수" },
              ].map((item, idx) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold text-sm">{item.step}</span>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-line">{item.label}</p>
                  {idx < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto mt-3 hidden md:block" />}
                </div>
              ))}
            </div>
          </div>

          {/* Location & Contact */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="font-bold">Location</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                2nd Floor, District 1,<br />
                Ho Chi Minh City, Vietnam
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h4 className="font-bold mb-4">Quick Contact</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  카카오톡 문의
                </a>
                <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                  이메일 접수
                </a>
                <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                  오피스 유선 번호
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AboutPage;
