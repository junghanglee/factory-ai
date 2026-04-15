import { useState, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { DollarSign, Users, Zap, Globe, Film, Settings, Smartphone, GraduationCap, Handshake, MapPin, MessageCircle, Mail, Phone, ChevronDown, ArrowRight, Send, Loader2, UserCheck, Code, Video, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import aboutHero from "@/assets/about-hero.jpg";
import aboutStrengths from "@/assets/about-strengths.jpg";
import aboutServices from "@/assets/about-services.jpg";
import aboutAcademy from "@/assets/about-academy.jpg";

const tabs = [
  { id: "brand", label: "Brand Story" },
  { id: "team", label: "Our Team" },
  { id: "strengths", label: "Core Strengths" },
  { id: "services", label: "Production Service" },
  { id: "academy", label: "AI Academy & B2B" },
  { id: "contact", label: "Contact Us" },
];

const emptyForm = { name: "", email: "", phone: "", company: "", inquiry_type: "일반 문의", message: "" };

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("brand");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
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
            진짜 AI로 만드는<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">새로운 콘텐츠의 미래</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            한국인 AI전문가가 베트남에 설립한 다국적 콘텐츠 생산팀
          </p>
          <button onClick={() => scrollToSection("brand")} className="animate-bounce mt-4">
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
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
      <section ref={(el) => { sectionRefs.current["brand"] = el; }} className="py-24 md:py-32">
        <div className="max-w-[1000px] mx-auto px-6">
          {/* Title */}
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Brand Story</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">인류의 시간을 창의성으로 되돌리다</h2>
            <p className="max-w-xl mx-auto text-xl text-muted-foreground">
              "당신의 천재성은 어디에 쓰이고 있습니까?"
            </p>
          </div>

          {/* Narrative */}
          <div className="max-w-3xl mx-auto space-y-10 mb-16">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              매일 아침, 수많은 인재가 사무실로 출근합니다. 하지만 그들이 마주하는 것은 위대한 아이디어가 아니라, 어제와 똑같은 복사 붙여넣기, 지루한 영상 편집, 끝이 보이지 않는 단순 반복 업무의 굴레입니다.
            </p>

            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                우리는 질문했습니다.<br />
                <span className="text-primary">"인간의 가장 고귀한 자산인 '창의성'이 왜 이런 사소한 일에 낭비되어야 하는가?"</span>
              </p>
            </div>

            <p className="text-xl text-center font-medium">
              이 질문이 바로 <strong>AI 팩토리(AI Factory)</strong>의 시작이었습니다.
            </p>
          </div>

          {/* Chapters */}
          <div className="space-y-16 mb-16">
            {/* 01 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-primary/20">01</span>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">공장(Factory)의 재정의: 굴뚝 대신 지능을 세우다</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  과거의 공장이 육체노동을 대신해 인류를 풍요롭게 했다면, 21세기의 공장은 <strong className="text-foreground">'지적 노동'</strong>을 대신해야 합니다.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  우리는 베트남 호치민, 가장 역동적으로 변화하는 도시의 중심에서 새로운 형태의 공장을 세웠습니다. 이곳은 연기를 내뿜는 굴뚝 대신 고도화된 AI 알고리즘이 숨 쉬고, 거친 기계음 대신 무한한 콘텐츠의 파동이 흐르는 곳입니다.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  AI 팩토리는 단순한 에이전시가 아닙니다. 귀사의 비즈니스 로직을 학습하고, 가장 효율적인 결과물을 24시간 찍어내는 <strong className="text-foreground">지능형 콘텐츠 생산 기지</strong>입니다.
                </p>
              </div>
            </div>

            {/* 02 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-primary/20">02</span>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">경계를 허무는 글로벌 시너지</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  우리의 팀은 경계가 없습니다. 한국의 정교한 기획력, 글로벌 수준의 AI 개발 기술, 그리고 베트남의 폭발적인 제작 에너지가 하나로 융합되어 있습니다. 3D 바디 스캐닝으로 가상 세계를 구축하고, AI 에이전트(V-CLAW)로 업무의 문법을 바꾸는 일.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  이 불가능해 보이던 일들은 AI 팩토리라는 용광로 안에서 <strong className="text-foreground">'압도적 성과'</strong>라는 이름의 결과물로 탄생합니다.
                </p>
              </div>
            </div>

            {/* 03 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-primary/20">03</span>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">우리의 약속: "성과는 당신의 것, 수고는 우리의 것"</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  우리는 기술을 자랑하지 않습니다. 우리가 진짜 자랑하고 싶은 것은 AI 팩토리를 통해 '자유'를 되찾은 고객들의 시간입니다.
                </p>
                <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                  <p className="text-muted-foreground">누군가는 밤샘 편집에서 해방되어 새로운 사업 전략을 구상합니다.</p>
                  <p className="text-muted-foreground">누군가는 복잡한 데이터 정리 대신 고객의 목소리에 한 번 더 귀를 기울입니다.</p>
                  <p className="text-muted-foreground">누군가는 AI가 만든 압도적 비주얼로 시장의 판도를 단숨에 뒤집습니다.</p>
                </div>
              </div>
            </div>

            {/* 04 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-primary/20">04</span>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">Next Chapter: 당신과 함께 쓸 미래</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  이제 당신이 답할 차례입니다. 여전히 과거의 방식에 묶여 계시겠습니까, 아니면 AI라는 강력한 엔진을 달고 미래로 질주하시겠습니까?
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  귀찮은 반복 업무는 AI 팩토리에게 맡기십시오. 그 너머의 위대한 성과는 오롯이 당신의 것입니다.
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12" style={{ background: "linear-gradient(135deg, hsl(246,65%,56%), hsl(210,100%,56%))" }}>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed text-center">
              우리는 당신의 가능성을 현실로 만드는 곳,<br />
              <span className="text-2xl md:text-3xl font-bold">여기는 AI 팩토리입니다.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Our Team */}
      <section ref={(el) => { sectionRefs.current["team"] = el; }} className="py-24 md:py-32 bg-secondary/30">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Our Team</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">다국적 전문가 팀</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              한국의 기획력과 베트남의 제작 역량이 만나 만들어낸 최적의 크리에이티브 조직
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: UserCheck,
                title: "한국인 AI & 마케팅 전문가",
                desc: "프로젝트 기획, 품질 관리, 고객 커뮤니케이션을 총괄하는 한국인 매니저 그룹. 한국 시장의 트렌드와 감성을 정확히 이해합니다.",
                color: "from-blue-500/20 to-blue-600/20",
                iconColor: "text-blue-400",
              },
              {
                icon: Code,
                title: "베트남 개발 전문가",
                desc: "AI 모델 파인튜닝, 웹/앱 개발, 자동화 시스템 구축을 담당하는 베트남 현지 엔지니어 팀. 빠른 실행력이 강점입니다.",
                color: "from-green-500/20 to-green-600/20",
                iconColor: "text-green-400",
              },
              {
                icon: Video,
                title: "영상 & 콘텐츠 전문가",
                desc: "AI 영상 제작, 모션 그래픽, 숏폼 콘텐츠 제작에 특화된 크리에이터. 최신 AI 툴을 활용한 고품질 영상을 빠르게 생산합니다.",
                color: "from-purple-500/20 to-purple-600/20",
                iconColor: "text-purple-400",
              },
              {
                icon: Palette,
                title: "디자인 & 브랜딩 전문가",
                desc: "브랜드 아이덴티티, UI/UX, 마케팅 소재 디자인을 담당. AI 생성 이미지와 전문 디자인을 결합한 하이브리드 작업이 가능합니다.",
                color: "from-orange-500/20 to-orange-600/20",
                iconColor: "text-orange-400",
              },
            ].map((member) => (
              <div key={member.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5", member.color)}>
                  <member.icon className={cn("h-6 w-6", member.iconColor)} />
                </div>
                <h3 className="font-bold text-base mb-2">{member.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>

          {/* Team synergy banner */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-center text-center">
              <div>
                <div className="text-3xl font-black text-primary mb-1">🇰🇷</div>
                <h4 className="font-bold text-sm">한국</h4>
                <p className="text-xs text-muted-foreground mt-1">기획 · 디렉팅 · 품질관리</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary hidden md:block" />
              <div>
                <div className="text-3xl font-black text-primary mb-1">🤖</div>
                <h4 className="font-bold text-sm">AI 엔진</h4>
                <p className="text-xs text-muted-foreground mt-1">자동화 · 생성 · 최적화</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary hidden md:block" />
              <div>
                <div className="text-3xl font-black text-primary mb-1">🇻🇳</div>
                <h4 className="font-bold text-sm">베트남</h4>
                <p className="text-xs text-muted-foreground mt-1">개발 · 제작 · 대량생산</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Core Strengths */}
      <section ref={(el) => { sectionRefs.current["strengths"] = el; }} className="relative py-24 md:py-32">
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
                <div key={label} className="contents">
                  <div className="p-4 border-t border-r border-white/10 text-white/70">{label}</div>
                  <div className="p-4 border-t border-r border-white/10 text-white/40 text-center line-through">{old}</div>
                  <div className="p-4 border-t border-white/10 text-blue-400 text-center font-semibold">{factory}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Production Service */}
      <section ref={(el) => { sectionRefs.current["services"] = el; }} className="py-24 md:py-32">
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

      {/* Section 5: AI Academy & B2B */}
      <section ref={(el) => { sectionRefs.current["academy"] = el; }} className="relative py-24 md:py-32 bg-secondary/50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">AI Academy & B2B</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">전문가 육성 & 해외 생산기지</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">AI 아카데미로 전문가를 육성하고, 육성된 전문가가 곧 실전 프로젝트의 핵심 인력이 됩니다</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-16">
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
                    <h4 className="font-semibold text-sm mb-1">🚀 전문가 양성 → 실전 투입</h4>
                    <p className="text-sm text-muted-foreground">아카데미 수료생이 곧바로 AI 팩토리의 프로젝트에 합류. 교육과 실무가 선순환하는 독보적 구조</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">🏭 스케일업 가능 인력 풀</h4>
                    <p className="text-sm text-muted-foreground">지속적 육성을 통해 대량 제작이 가능한 인력 규모를 확보. B2B 대량 계약에도 유연하게 대응합니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Handshake className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">B2B 파트너십 & 해외 생산기지</h3>
              </div>
              <div className="space-y-6">
                {[
                  { title: "정기 구독형 서비스", desc: "매월 일정량의 콘텐츠를 고정비로 안정적으로 수급하는 '콘텐츠 정기 구독'" },
                  { title: "연간 계약 & 전담팀 배치", desc: "전담 팀 배치 및 AI 자동화 시스템 우선 구축 지원. 귀사만의 해외 콘텐츠 생산기지를 구축합니다" },
                  { title: "대량 계약 스케일링", desc: "아카데미에서 육성된 전문 인력 풀을 활용해 대규모 프로젝트도 유연하게 소화 가능" },
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

          {/* Cycle Diagram */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <h3 className="text-lg font-bold text-center mb-8">AI 팩토리의 선순환 구조</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { step: "01", emoji: "🎓", label: "AI 아카데미\n전문가 육성" },
                { step: "02", emoji: "💼", label: "실전 프로젝트\n즉시 투입" },
                { step: "03", emoji: "📈", label: "대량 생산\n스케일업" },
                { step: "04", emoji: "🤝", label: "B2B 계약\n해외기지 구축" },
              ].map((item, idx) => (
                <div key={item.step} className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                  <span className="text-xs text-primary font-mono">{item.step}</span>
                  <p className="text-sm font-medium whitespace-pre-line mt-1">{item.label}</p>
                  {idx < 3 && <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 hidden md:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Contact Us */}
      <section ref={(el) => { sectionRefs.current["contact"] = el; }} className="py-24 md:py-32">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">Contact Us</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">문의 및 상담</h2>
            <p className="text-muted-foreground text-lg">귀사의 성장을 가속화할 준비가 되셨나요?</p>
          </div>

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

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-card border border-border rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6">문의하기</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!form.name || !form.email || !form.message) {
                    toast.error("이름, 이메일, 메시지는 필수입니다.");
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const { error } = await supabase.from("contact_inquiries").insert({
                      name: form.name,
                      email: form.email,
                      phone: form.phone || null,
                      company: form.company || null,
                      inquiry_type: form.inquiry_type,
                      message: form.message,
                    });
                    if (error) throw error;
                    toast.success("문의가 접수되었습니다. 빠르게 연락드리겠습니다!");
                    setForm(emptyForm);
                  } catch (err: any) {
                    toast.error("문의 접수 실패: " + err.message);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이름 *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">회사명</label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="(주)회사명" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이메일 *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">전화번호</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">문의 유형</label>
                  <Select value={form.inquiry_type} onValueChange={(v) => setForm({ ...form, inquiry_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="일반 문의">일반 문의</SelectItem>
                      <SelectItem value="AI 영상 제작">AI 영상 제작</SelectItem>
                      <SelectItem value="AI 자동화 솔루션">AI 자동화 솔루션</SelectItem>
                      <SelectItem value="디지털 마케팅">디지털 마케팅</SelectItem>
                      <SelectItem value="AI 아카데미">AI 아카데미</SelectItem>
                      <SelectItem value="B2B 파트너십">B2B 파트너십</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">메시지 *</label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="문의 내용을 입력해주세요..."
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "접수 중..." : "문의 보내기"}
                </Button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-6">
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
                <div className="space-y-4">
                  <a href="https://open.kakao.com/o/seanvtn6620" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">카카오톡 문의</div>
                      <div className="text-xs">seanvtn6620@kakao.com</div>
                    </div>
                  </a>
                  <a href="mailto:junghanglee@gmail.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">이메일 접수</div>
                      <div className="text-xs">junghanglee@gmail.com</div>
                    </div>
                  </a>
                  <a href="tel:+840777436620" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">오피스 유선 번호</div>
                      <div className="text-xs">+84 077-743-6620 (한국어가능)</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AboutPage;
