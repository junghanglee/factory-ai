import { useState, useRef } from "react";
import aiFactoryLogoWhite from "@/assets/ai-factory-logo-white.png";
import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/SEO";
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
import { useTranslation } from "react-i18next";

const emptyForm = { name: "", email: "", phone: "", company: "", inquiry_type: "일반 문의", message: "" };

const AboutPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("brand");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const tabs = [
    { id: "brand", label: t("about.tabs.brand") },
    { id: "team", label: t("about.tabs.team") },
    { id: "strengths", label: t("about.tabs.strengths") },
    { id: "services", label: t("about.tabs.services") },
    { id: "academy", label: t("about.tabs.academy") },
    { id: "contact", label: t("about.tabs.contact") },
  ];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MainLayout>
      <SEO
        title="회사소개 — 링크투 AI팩토리 | 해외 자동화 AI 영상·웹툰 제작"
        description="링크투 AI팩토리는 숙련된 해외 작업자와 AI 자동화 대량생산 라인으로 AI 영상제작·웹툰제작·콘텐츠제작을 한국 에이전시 대비 반값에 제공하는 마켓플레이스입니다."
        path="/about"
      />
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={aboutHero} alt="AI Factory Team" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <img src={aiFactoryLogoWhite} alt="LINKTO Factory" className="h-40 md:h-56 w-auto mx-auto mb-6" />
          <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-4 font-medium">{t("about.hero.subtitle")}</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            {t("about.hero.title1")}<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t("about.hero.title2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            {t("about.hero.desc")}
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
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">{t("about.brand.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("about.brand.title")}</h2>
            <p className="max-w-xl mx-auto text-xl text-muted-foreground">{t("about.brand.quote")}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-10 mb-16">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">{t("about.brand.intro")}</p>

            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                {t("about.brand.bigQuestion1")}<br />
                <span className="text-primary">{t("about.brand.bigQuestion2")}</span>
              </p>
            </div>

            <p className="text-xl text-center font-medium" dangerouslySetInnerHTML={{ __html: t("about.brand.origin") }} />
          </div>

          <div className="space-y-16 mb-16">
            {/* 01 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3"><span className="text-5xl font-black text-primary/20">01</span></div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t("about.brand.ch01Title")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t("about.brand.ch01P1") }} />
                <p className="text-muted-foreground leading-relaxed mb-4">{t("about.brand.ch01P2")}</p>
                <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.brand.ch01P3") }} />
              </div>
            </div>
            {/* 02 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3"><span className="text-5xl font-black text-primary/20">02</span></div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t("about.brand.ch02Title")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("about.brand.ch02P1")}</p>
                <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.brand.ch02P2") }} />
              </div>
            </div>
            {/* 03 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3"><span className="text-5xl font-black text-primary/20">03</span></div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t("about.brand.ch03Title")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("about.brand.ch03P1")}</p>
                <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                  <p className="text-muted-foreground">{t("about.brand.ch03B1")}</p>
                  <p className="text-muted-foreground">{t("about.brand.ch03B2")}</p>
                  <p className="text-muted-foreground">{t("about.brand.ch03B3")}</p>
                </div>
              </div>
            </div>
            {/* 04 */}
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex items-center gap-3"><span className="text-5xl font-black text-primary/20">04</span></div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t("about.brand.ch04Title")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("about.brand.ch04P1")}</p>
                <p className="text-muted-foreground leading-relaxed">{t("about.brand.ch04P2")}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12" style={{ background: "linear-gradient(135deg, hsl(246,65%,56%), hsl(210,100%,56%))" }}>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed text-center">
              {t("about.brand.closing1")}<br />
              <span className="text-2xl md:text-3xl font-bold">{t("about.brand.closing2")}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Our Team */}
      <section ref={(el) => { sectionRefs.current["team"] = el; }} className="py-24 md:py-32 bg-secondary/30">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">{t("about.team.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("about.team.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("about.team.desc")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: UserCheck, title: t("about.team.role1Title"), desc: t("about.team.role1Desc"), color: "from-blue-500/20 to-blue-600/20", iconColor: "text-blue-400" },
              { icon: Code, title: t("about.team.role2Title"), desc: t("about.team.role2Desc"), color: "from-green-500/20 to-green-600/20", iconColor: "text-green-400" },
              { icon: Video, title: t("about.team.role3Title"), desc: t("about.team.role3Desc"), color: "from-purple-500/20 to-purple-600/20", iconColor: "text-purple-400" },
              { icon: Palette, title: t("about.team.role4Title"), desc: t("about.team.role4Desc"), color: "from-orange-500/20 to-orange-600/20", iconColor: "text-orange-400" },
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

          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-center text-center">
              <div>
                <div className="text-3xl font-black text-primary mb-1">🇰🇷</div>
                <h4 className="font-bold text-sm">{t("about.team.koreaLabel")}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t("about.team.koreaDesc")}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary hidden md:block" />
              <div>
                <div className="text-3xl font-black text-primary mb-1">🤖</div>
                <h4 className="font-bold text-sm">{t("about.team.aiLabel")}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t("about.team.aiDesc")}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary hidden md:block" />
              <div>
                <div className="text-3xl font-black text-primary mb-1">🇻🇳</div>
                <h4 className="font-bold text-sm">{t("about.team.vietnamLabel")}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t("about.team.vietnamDesc")}</p>
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
            <p className="text-sm tracking-[0.2em] uppercase text-blue-400 font-semibold mb-3">{t("about.strengths.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t("about.strengths.title")}</h2>
            <p className="text-white/60 text-lg">{t("about.strengths.desc")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: DollarSign, num: "01", title: t("about.strengths.s01Title"), sub: "Cost-Efficiency", desc: t("about.strengths.s01Desc") },
              { icon: Users, num: "02", title: t("about.strengths.s02Title"), sub: "No-Barrier", desc: t("about.strengths.s02Desc") },
              { icon: Zap, num: "03", title: t("about.strengths.s03Title"), sub: "Speed-Tech", desc: t("about.strengths.s03Desc") },
              { icon: Globe, num: "04", title: t("about.strengths.s04Title"), sub: "Global Insight", desc: t("about.strengths.s04Desc") },
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
              <h3 className="text-white font-bold text-lg text-center">{t("about.strengths.compTitle")}</h3>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <div className="p-4 border-r border-white/10 text-white/40 font-medium">{t("about.strengths.compCategory")}</div>
              <div className="p-4 border-r border-white/10 text-white/60 text-center font-medium">{t("about.strengths.compOld")}</div>
              <div className="p-4 text-blue-400 text-center font-bold">{t("about.strengths.compNew")}</div>
              {[
                [t("about.strengths.compCost"), t("about.strengths.compCostOld"), t("about.strengths.compCostNew")],
                [t("about.strengths.compTime"), t("about.strengths.compTimeOld"), t("about.strengths.compTimeNew")],
                [t("about.strengths.compRevisions"), t("about.strengths.compRevisionsOld"), t("about.strengths.compRevisionsNew")],
                [t("about.strengths.compQuantity"), t("about.strengths.compQuantityOld"), t("about.strengths.compQuantityNew")],
                [t("about.strengths.compComm"), t("about.strengths.compCommOld"), t("about.strengths.compCommNew")],
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
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">{t("about.services.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("about.services.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("about.services.desc")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Film, title: t("about.services.svc1Title"), sub: "AI Vision", items: [t("about.services.svc1I1"), t("about.services.svc1I2"), t("about.services.svc1I3")] },
              { icon: Settings, title: t("about.services.svc2Title"), sub: "Automation", items: [t("about.services.svc2I1"), t("about.services.svc2I2")] },
              { icon: Smartphone, title: t("about.services.svc3Title"), sub: "Growth", items: [t("about.services.svc3I1"), t("about.services.svc3I2")] },
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
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">{t("about.services.bannerTitle")}</h3>
                <p className="text-white/60">{t("about.services.bannerDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: AI Academy & B2B */}
      <section ref={(el) => { sectionRefs.current["academy"] = el; }} className="relative py-24 md:py-32 bg-secondary/50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">{t("about.academy.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("about.academy.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("about.academy.desc")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={aboutAcademy} alt="AI Academy" className="w-full h-[240px] object-cover" loading="lazy" width={1920} height={800} />
              <div className="bg-card border border-border border-t-0 rounded-b-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">{t("about.academy.academyTitle")}</h3>
                </div>
                <div className="space-y-4">
                  <div><h4 className="font-semibold text-sm mb-1">{t("about.academy.edu1Title")}</h4><p className="text-sm text-muted-foreground">{t("about.academy.edu1Desc")}</p></div>
                  <div><h4 className="font-semibold text-sm mb-1">{t("about.academy.edu2Title")}</h4><p className="text-sm text-muted-foreground">{t("about.academy.edu2Desc")}</p></div>
                  <div><h4 className="font-semibold text-sm mb-1">{t("about.academy.edu3Title")}</h4><p className="text-sm text-muted-foreground">{t("about.academy.edu3Desc")}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Handshake className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">{t("about.academy.b2bTitle")}</h3>
              </div>
              <div className="space-y-6">
                {[
                  { title: t("about.academy.b2b1Title"), desc: t("about.academy.b2b1Desc") },
                  { title: t("about.academy.b2b2Title"), desc: t("about.academy.b2b2Desc") },
                  { title: t("about.academy.b2b3Title"), desc: t("about.academy.b2b3Desc") },
                  { title: t("about.academy.b2b4Title"), desc: t("about.academy.b2b4Desc") },
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

          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <h3 className="text-lg font-bold text-center mb-8">{t("about.academy.cycleTitle")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { step: "01", emoji: "🎓", label: t("about.academy.cycle1") },
                { step: "02", emoji: "💼", label: t("about.academy.cycle2") },
                { step: "03", emoji: "📈", label: t("about.academy.cycle3") },
                { step: "04", emoji: "🤝", label: t("about.academy.cycle4") },
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
            <p className="text-sm tracking-[0.2em] uppercase text-primary font-semibold mb-3">{t("about.contact.sectionLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("about.contact.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("about.contact.desc")}</p>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-8 md:p-12 text-center mb-12">
            <p className="text-lg md:text-xl font-medium mb-6">{t("about.contact.ctaBanner")}</p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, hsl(246,65%,56%), hsl(210,100%,56%))" }}
            >
              <MessageCircle className="h-5 w-5" />
              {t("about.contact.ctaButton")}
            </a>
          </div>

          <div className="mb-12">
            <h3 className="text-lg font-bold text-center mb-8">{t("about.contact.processTitle")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "01", label: t("about.contact.process1") },
                { step: "02", label: t("about.contact.process2") },
                { step: "03", label: t("about.contact.process3") },
                { step: "04", label: t("about.contact.process4") },
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
              <h3 className="text-lg font-bold mb-6">{t("about.contact.formTitle")}</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!form.name || !form.email || !form.message) {
                    toast.error(t("about.contact.requiredError"));
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const { error } = await supabase.from("contact_inquiries").insert({
                      name: form.name, email: form.email, phone: form.phone || null,
                      company: form.company || null, inquiry_type: form.inquiry_type, message: form.message,
                    });
                    if (error) throw error;
                    toast.success(t("about.contact.submitSuccess"));
                    setForm(emptyForm);
                  } catch (err: any) {
                    toast.error(t("about.contact.submitFailed") + err.message);
                  } finally { setSubmitting(false); }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("about.contact.nameLabel")}</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("about.contact.namePlaceholder")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("about.contact.companyLabel")}</label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder={t("about.contact.companyPlaceholder")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("about.contact.emailLabel")}</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("about.contact.phoneLabel")}</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("about.contact.inquiryTypeLabel")}</label>
                  <Select value={form.inquiry_type} onValueChange={(v) => setForm({ ...form, inquiry_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="일반 문의">{t("about.contact.typeGeneral")}</SelectItem>
                      <SelectItem value="구매/주문 문의">{t("about.contact.typeVideo")}</SelectItem>
                      <SelectItem value="콘텐츠 제작 문의">{t("about.contact.typeAutomation")}</SelectItem>
                      <SelectItem value="기술 지원 문의">{t("about.contact.typeMarketing")}</SelectItem>
                      <SelectItem value="환불/분쟁 문의">{t("about.contact.typeAcademy")}</SelectItem>
                      <SelectItem value="B2B 파트너십">{t("about.contact.typePartnership")}</SelectItem>
                      <SelectItem value="기타">{t("about.contact.typeOther")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t("about.contact.messageLabel")}</label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t("about.contact.messagePlaceholder")} rows={4} />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? t("about.contact.submitting") : t("about.contact.submitBtn")}
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
                  15 Đường số 21, Khu dân cư Phước Kiển A, Nhà Bè, Hồ Chí Minh
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h4 className="font-bold mb-4">Quick Contact</h4>
                <div className="space-y-4">
                  <a href="https://open.kakao.com/o/seanvtn6620" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{t("about.contact.kakaoTitle")}</div>
                      <div className="text-sm">seanvtn6620@kakao.com</div>
                    </div>
                  </a>
                  <a href="mailto:junghanglee@gmail.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{t("about.contact.emailTitle")}</div>
                      <div className="text-sm">
                        junghanglee@gmail.com(KR)<br />
                        Contact@linkto.vn (VN)
                      </div>
                    </div>
                  </a>
                  <a href="tel:+840777436620" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{t("about.contact.officePhone")}</div>
                      <div className="text-sm">
                        +84 077-743-6620 ({t("about.contact.koreanConsult")})<br />
                        +84 035-404-2660 ({t("about.contact.vietnamConsult")})
                      </div>
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
