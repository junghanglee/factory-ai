import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

interface Props {
  variant?: "header" | "footer";
}

const LanguageSwitcher = ({ variant = "header" }: Props) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "ko";

  const toggle = () => {
    i18n.changeLanguage(currentLang === "ko" ? "en" : "ko");
  };

  if (variant === "footer") {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Globe className="h-3 w-3" />
        {currentLang === "ko" ? "English" : "한국어"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-full transition-colors"
    >
      <Globe className="h-3 w-3" />
      {currentLang === "ko" ? "EN" : "KO"}
    </button>
  );
};

export default LanguageSwitcher;
