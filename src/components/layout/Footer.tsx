import { Link } from "react-router-dom";
import { categories } from "@/data/categories";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>
                AI
              </div>
              <span className="text-xl font-bold">AI팩토리</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              AI로 만드는 콘텐츠,<br />
              에이전시 반값에 빠르고 높은 퀄리티로.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4 text-sm">서비스 카테고리</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.id}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-sm">고객 지원</h3>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/chat" className="hover:opacity-100">1:1 문의</Link></li>
              <li><a href="#" className="hover:opacity-100">자주 묻는 질문</a></li>
              <li><a href="#" className="hover:opacity-100">이용 가이드</a></li>
              <li><a href="#" className="hover:opacity-100">환불 정책</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-sm">회사 정보</h3>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#" className="hover:opacity-100">회사 소개</a></li>
              <li><a href="#" className="hover:opacity-100">이용약관</a></li>
              <li><a href="#" className="hover:opacity-100">개인정보처리방침</a></li>
              <li><a href="#" className="hover:opacity-100">파트너 등록</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-50">
          © 2026 AI팩토리. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
