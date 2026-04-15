import { Link } from "react-router-dom";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1200px] mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-6 w-auto opacity-80" />
          <span className="text-[11px] text-muted-foreground">© 2026 AI팩토리 All right reserved</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
          <span className="text-border">|</span>
          <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
          <span className="text-border">|</span>
          <a href="#" className="hover:text-foreground transition-colors">이용 가이드</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
