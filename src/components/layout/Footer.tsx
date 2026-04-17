import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1200px] mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-6 w-auto opacity-80" />
          <span className="text-[11px] text-muted-foreground">{t("footer.copyright")}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <a href="https://company.linktofactory.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t("footer.company")}</a>
          <span className="text-border">|</span>
          <a href="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</a>
          <span className="text-border">|</span>
          <a href="#" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a>
          <span className="text-border">|</span>
          <a href="#" className="hover:text-foreground transition-colors">{t("footer.guide")}</a>
          <span className="text-border">|</span>
          <LanguageSwitcher variant="footer" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
