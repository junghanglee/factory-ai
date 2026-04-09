import catAiImage from "@/assets/cat-ai-image.png";
import catAiVideo from "@/assets/cat-ai-video.png";
import catAiWebtoon from "@/assets/cat-ai-webtoon.png";
import catAiAds from "@/assets/cat-ai-ads.png";
import catAiAssistant from "@/assets/cat-ai-assistant.png";
import catAiGame from "@/assets/cat-ai-game.png";

export const categories = [
  {
    id: "ai-image",
    name: "AI 이미지",
    image: catAiImage,
    description: "로고, 배너, 상세페이지, 썸네일, 일러스트",
    color: "hsl(246, 65%, 56%)",
    serviceCount: 128,
  },
  {
    id: "ai-video",
    name: "AI 영상",
    image: catAiVideo,
    description: "숏폼, 제품영상, 모션그래픽, AI 아바타 영상",
    color: "hsl(210, 100%, 56%)",
    serviceCount: 85,
  },
  {
    id: "ai-webtoon",
    name: "AI 웹툰",
    image: catAiWebtoon,
    description: "AI 웹툰 제작, 스토리보드, 캐릭터 디자인",
    color: "hsl(280, 65%, 55%)",
    serviceCount: 37,
  },
  {
    id: "ai-ads",
    name: "AI 광고",
    image: catAiAds,
    description: "퍼포먼스 광고, SNS 광고 소재",
    color: "hsl(30, 90%, 55%)",
    serviceCount: 63,
  },
  {
    id: "ai-assistant",
    name: "AI 비서구축",
    image: catAiAssistant,
    description: "챗봇, 자동화, API 연동, 크레딧 제공",
    color: "hsl(160, 70%, 42%)",
    serviceCount: 42,
  },
  {
    id: "ai-game",
    name: "미니게임",
    image: catAiGame,
    description: "미니게임 개발, 인터랙티브 콘텐츠",
    color: "hsl(340, 75%, 55%)",
    serviceCount: 31,
  },
];
