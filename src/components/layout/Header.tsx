import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>
              AI
            </div>
            <span className="text-xl font-bold text-foreground">
              AI팩토리
            </span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="어떤 AI 콘텐츠가 필요하세요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">회원가입</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Category nav - desktop */}
      <div className="hidden md:block border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 h-12 overflow-x-auto">
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary rounded-md hover:bg-accent transition-colors"
                onMouseEnter={() => setCategoryMenuOpen(true)}
                onMouseLeave={() => setCategoryMenuOpen(false)}
              >
                <Menu className="h-4 w-4" />
                전체 카테고리
                <ChevronDown className="h-3 w-3" />
              </button>

              {categoryMenuOpen && (
                <div
                  className="absolute top-full left-0 w-64 bg-background border rounded-lg shadow-lg py-2 z-50"
                  onMouseEnter={() => setCategoryMenuOpen(true)}
                  onMouseLeave={() => setCategoryMenuOpen(false)}
                >
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <cat.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{cat.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{cat.serviceCount}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
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
          <div className="px-4 py-3">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="어떤 AI 콘텐츠가 필요하세요?"
                className="w-full h-10 pl-4 pr-12 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <cat.icon className="h-4 w-4 text-muted-foreground" />
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">로그인</Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button className="w-full" size="sm">회원가입</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
