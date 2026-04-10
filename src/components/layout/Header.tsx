import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, ChevronDown, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top bar */}
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center justify-between h-[60px] gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-10 w-auto" />
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-[500px]">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="어떤 AI 콘텐츠가 필요하세요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-5 pr-14 rounded-full border border-border bg-background text-[15px] focus:outline-none focus:border-foreground transition-colors"
              />
              <button className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/mypage" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  마이페이지
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      관리자
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
                  <LogOut className="h-3.5 w-3.5" />
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                  로그인
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full h-9 px-5 text-[14px] font-medium">회원가입</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Category nav - desktop */}
      <div className="hidden md:block border-t border-b border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <nav className="flex items-center gap-0 h-[46px]">
            <div className="relative">
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-foreground hover:text-primary transition-colors"
                onMouseEnter={() => setCategoryMenuOpen(true)}
                onMouseLeave={() => setCategoryMenuOpen(false)}
              >
                <Menu className="h-4 w-4" />
                전체 카테고리
                <ChevronDown className="h-3 w-3" />
              </button>
              {categoryMenuOpen && (
                <div
                  className="absolute top-full left-0 w-56 bg-background border rounded-lg shadow-lg py-1.5 z-50"
                  onMouseEnter={() => setCategoryMenuOpen(true)}
                  onMouseLeave={() => setCategoryMenuOpen(false)}
                >
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-secondary transition-colors"
                    >
                      <img src={cat.image} alt={cat.name} className="h-5 w-5 object-contain" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="w-px h-5 bg-border mx-1" />
            <Link
              to="/about"
              className="px-3 py-2 text-[14px] font-semibold text-primary hover:text-primary/80 whitespace-nowrap transition-colors"
            >
              AI팩토리 소개
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="px-3 py-2 text-[14px] text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-5 py-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="어떤 AI 콘텐츠가 필요하세요?"
                className="w-full h-11 pl-5 pr-14 rounded-full border text-[15px] focus:outline-none focus:border-foreground"
              />
              <button className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-0.5">
              <Link
                to="/about"
                className="flex items-center gap-3 px-3 py-3 text-[14px] font-semibold text-primary rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI팩토리 소개
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="flex items-center gap-3 px-3 py-3 text-[14px] rounded-lg hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src={cat.image} alt={cat.name} className="h-5 w-5 object-contain" />
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t">
              {user ? (
                <>
                  <Link to="/mypage" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full" size="sm">마이페이지</Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full" size="sm">관리자</Button>
                    </Link>
                  )}
                  <Button variant="outline" className="flex-1 rounded-full" size="sm" onClick={handleSignOut}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full" size="sm">로그인</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full" size="sm">회원가입</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
