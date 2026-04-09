const portfolioItems = [
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop", alt: "AI 로고 디자인" },
  { src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=400&fit=crop", alt: "AI 영상 제작" },
  { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop", alt: "상세페이지 디자인" },
  { src: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=400&fit=crop", alt: "브랜딩 디자인" },
  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop", alt: "광고 소재" },
  { src: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=400&fit=crop", alt: "AI 일러스트" },
];

const PortfolioGallery = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
          포트폴리오
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          AI팩토리에서 제작한 실제 결과물입니다
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolioItems.map((item, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <span className="text-background font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.alt}
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
