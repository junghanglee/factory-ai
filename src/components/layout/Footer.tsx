import { Link } from "react-router-dom";
import { categories } from "@/data/categories";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-primary-foreground font-bold text-[10px]"
                style={{ background: "var(--gradient-primary)" }}
              >
                AI
              </div>
              <span className="text-[18px] font-bold text-foreground">AI팩토리</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              AI로 만드는 콘텐츠,<br />에이전시 반값에.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">카테고리</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.id}`} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">고객 지원</h3>
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              <li><Link to="/chat" className="hover:text-foreground transition-colors">1:1 문의</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">자주 묻는 질문</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">이용 가이드</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">환불 정책</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">회사</h3>
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">회사 소개</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">파트너 등록</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-[12px] text-muted-foreground">
          © 2026 AI팩토리. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
