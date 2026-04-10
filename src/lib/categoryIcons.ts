import catAiImage from "@/assets/cat-ai-image.png";
import catAiVideo from "@/assets/cat-ai-video.png";
import catAiWebtoon from "@/assets/cat-ai-webtoon.png";
import catAiAds from "@/assets/cat-ai-ads.png";
import catAiAssistant from "@/assets/cat-ai-assistant.png";
import catAiGame from "@/assets/cat-ai-game.png";
import catAll from "@/assets/cat-all.png";
import catDefault from "@/assets/cat-default.png";

/**
 * Maps category slugs to their 3D icon images.
 * New categories automatically get the default AI icon.
 */
const iconMap: Record<string, string> = {
  "ai-image": catAiImage,
  "ai-video": catAiVideo,
  "ai-webtoon": catAiWebtoon,
  "ai-ads": catAiAds,
  "ai-assistant": catAiAssistant,
  "ai-music": catAiGame, // slug used for 미니게임
};

export const getCategoryIcon = (slug: string): string => {
  return iconMap[slug] || catDefault;
};

export const getAllCategoryIcon = (): string => catAll;
export const getDefaultCategoryIcon = (): string => catDefault;

/** Slugs that should be hidden from the hero category grid */
const HIDDEN_CATEGORY_SLUGS = ["ai팩토리소개"];

export const shouldShowInHeroGrid = (slug: string): boolean => {
  return !HIDDEN_CATEGORY_SLUGS.includes(slug);
};
