import { Link } from "react-router-dom";

const portfolioItems = [
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop", alt: "AI 로고 디자인", category: "이미지/디자인" },
  { src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop", alt: "AI 영상 제작", category: "영상/모션" },
  { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop", alt: "상세페이지 디자인", category: "이미지/디자인" },
  { src: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=300&fit=crop", alt: "브랜딩 디자인", category: "이미지/디자인" },
  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop", alt: "광고 소재", category: "광고 제작" },
  { src: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=300&fit=crop", alt: "AI 일러스트", category: "웹툰/미니게임" },
];

const PortfolioGallery = () => {
  return (
    <section className="py-14">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] font-bold text-foreground">포트폴리오</h2>
          <Link to="/category/ai-image" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolioItems.map((item, idx) => (
            <div
              key={idx}
              className="aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer relative bg-secondary"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-colors flex flex-col items-center justify-center">
                <span className="text-background text-[14px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.alt}
                </span>
                <span className="text-background/70 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioGallery;
