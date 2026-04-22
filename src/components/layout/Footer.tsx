import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { COMPANY } from "@/pages/legal/CompanyInfo";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1200px] mx-auto px-5 py-8 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src={aiFactoryLogo} alt="LINKTO Factory 로고" className="h-7 w-auto opacity-90" />
            <span className="text-sm font-semibold text-foreground">LINKTO Factory</span>
          </div>
          <div className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            <p className="text-foreground/90">
              <span className="font-medium">{COMPANY.legalName}</span>
              <span className="ml-2 text-muted-foreground">({COMPANY.legalNameEn})</span>
            </p>
            <p>대표: {COMPANY.representative} · 사업자등록번호 {COMPANY.bizNumber}</p>
            <p>{COMPANY.address}</p>
            <p>
              고객지원:{" "}
              <a href={`mailto:${COMPANY.email}`} className="hover:text-foreground transition-colors">
                {COMPANY.email}
              </a>
            </p>
            <p className="pt-2 text-muted-foreground/80">
              결제는 글로벌 결제대행사 Paddle.com Market Limited를 통해 USD로 처리됩니다.
            </p>
            <p className="pt-1 text-muted-foreground/70">{t("footer.copyright")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-xs text-muted-foreground md:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            <a
              href="https://company.linktofactory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.company")}
            </a>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              환불 정책
            </Link>
            <Link to="/acceptable-use" className="hover:text-foreground transition-colors">
              이용 정책
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              {t("footer.guide")}
            </Link>
          </nav>
          <LanguageSwitcher variant="footer" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
