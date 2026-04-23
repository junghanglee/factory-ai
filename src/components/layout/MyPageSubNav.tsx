import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { MessageCircle, Package, Receipt, HelpCircle, User, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MyPageSubNavProps {
  /** Number badge to show on 신청내역 tab (optional) */
  projectsCount?: number;
}

const items = [
  { id: "projects", label: "신청내역", icon: Package, path: "/mypage" },
  { id: "payments", label: "결제내역", icon: Receipt, path: "/mypage" },
  { id: "wallet", label: "캐시·포인트", icon: Wallet, path: "/mypage" },
  { id: "inquiries", label: "1:1 문의", icon: HelpCircle, path: "/mypage" },
  { id: "chat", label: "채팅 상담", icon: MessageCircle, path: "/chat" },
  { id: "profile", label: "내 정보", icon: User, path: "/mypage" },
];

const MyPageSubNav = ({ projectsCount }: MyPageSubNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTabParam = searchParams.get("tab");

  const isChatRoute = location.pathname.startsWith("/chat");
  const activeId = isChatRoute ? "chat" : (activeTabParam || "projects");

  const handleClick = (id: string, path: string) => {
    if (path === "/chat") navigate("/chat");
    else navigate(`${path}?tab=${id}`);
  };

  return (
    <div className="border-b border-border bg-card sticky top-[60px] z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-0 h-[46px] overflow-x-auto">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id, item.path)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[14px] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.id === "projects" && projectsCount !== undefined && projectsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{projectsCount}</Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MyPageSubNav;
