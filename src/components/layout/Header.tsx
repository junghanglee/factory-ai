import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top bar */}
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center justify-between h-[60px] gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xs"
              style={{ background: "var(--gradient-primary)" }}
            >
              AI
            </div>
            <span className="text-[22px] font-bold tracking-tight text-foreground">
              AI팩토리
            </span>
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
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/login"
              className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
            >
              로그인
            </Link>
            <Link to="/signup">
              <Button className="rounded-full h-9 px-5 text-[14px] font-medium">
                회원가입
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Category nav - desktop */}
      <div className="hidden md:block border-t border-b border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <nav className="flex items-center gap-0 h-[46px]">
            {/* All categories dropdown */}
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
                      <cat.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-border mx-1" />

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
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="flex items-center gap-3 px-3 py-3 text-[14px] rounded-lg hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <cat.icon className="h-4 w-4 text-muted-foreground" />
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full rounded-full" size="sm">
                  로그인
                </Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button className="w-full rounded-full" size="sm">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
