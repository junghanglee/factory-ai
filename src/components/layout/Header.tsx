import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, Settings, Package, Receipt, FileText, HelpCircle, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon, shouldShowInHeroGrid } from "@/lib/categoryIcons";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadChat } from "@/hooks/useUnreadChat";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [myPageMenuOpen, setMyPageMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { data: dbCategories = [] } = useCategories();
  const categories = dbCategories.filter((c) => shouldShowInHeroGrid(c.slug));
  const navigate = useNavigate();
  const location = useLocation();
  const myPageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { unreadCount } = useUnreadChat();

  const myPageMenuItems = [
    { id: "projects", label: "신청내역", icon: Package },
    { id: "payments", label: "결제내역", icon: Receipt },
    { id: "invoice", label: "계산서 요청", icon: FileText },
    { id: "inquiries", label: "1:1 문의", icon: HelpCircle },
    { id: "chat", label: "채팅 상담", icon: MessageCircle },
    { id: "profile", label: "내 정보", icon: User },
  ];

  const handleMyPageEnter = () => {
    if (myPageTimeoutRef.current) clearTimeout(myPageTimeoutRef.current);
    setMyPageMenuOpen(true);
  };
  const handleMyPageLeave = () => {
    myPageTimeoutRef.current = setTimeout(() => setMyPageMenuOpen(false), 150);
  };

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

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="relative"
                  onMouseEnter={handleMyPageEnter}
                  onMouseLeave={handleMyPageLeave}
                >
                  <Link to="/mypage" className="relative flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                    마이페이지
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-4 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </Link>
                  {myPageMenuOpen && (
                    <div className="absolute top-full right-0 w-48 bg-background border rounded-lg shadow-lg py-1.5 z-50">
                      {myPageMenuItems.map((item) => (
                         <Link
                          key={item.id}
                          to={`/mypage?tab=${item.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-secondary transition-colors"
                          onClick={() => setMyPageMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                          {item.id === "chat" && unreadCount > 0 && (
                            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
                      <img src={getCategoryIcon(cat.slug)} alt={cat.name} className="h-5 w-5 object-contain" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="w-px h-5 bg-border mx-1" />
            <Link
              to="/about"
              className={`px-3 py-2 text-[14px] font-semibold whitespace-nowrap transition-colors ${location.pathname === "/about" ? "text-primary border-b-2 border-primary" : "text-primary hover:text-primary/80"}`}
            >
              AI팩토리 소개
            </Link>
            {categories.map((cat) => {
              const isActive = location.pathname === `/category/${cat.id}`;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`relative px-3 py-2 text-[14px] whitespace-nowrap transition-colors ${isActive ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {(cat.id === "ai-video" || cat.id === "ai-assistant") && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-px text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground leading-tight">
                      인기
                    </span>
                  )}
                  {cat.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-5 py-4">
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
                  <img src={getCategoryIcon(cat.slug)} alt={cat.name} className="h-5 w-5 object-contain" />
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
