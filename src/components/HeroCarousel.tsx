import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Super Sale Weekend",
      subtitle: "Up to 70% Off",
      description: "Electronics, Fashion & More",
      buttonText: "Shop Now",
      bgColor: "bg-gradient-hero",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Fresh Collection 2024",
      description: "Latest trends in fashion",
      buttonText: "Explore",
      bgColor: "bg-gradient-accent",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "Mobile Phones",
      subtitle: "Starting ₹9,999",
      description: "Latest smartphones with best offers",
      buttonText: "Buy Now",
      bgColor: "bg-gradient-primary",
      textColor: "text-white"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg shadow-lg">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 ${slide.bgColor} ${slide.textColor} transition-transform duration-500 ease-in-out flex items-center justify-center ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div className="text-center px-4 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 animate-fade-in">
              {slide.title}
            </h1>
            <h2 className="text-xl md:text-3xl font-semibold mb-3 animate-fade-in">
              {slide.subtitle}
            </h2>
            <p className="text-lg md:text-xl mb-6 opacity-90 animate-fade-in">
              {slide.description}
            </p>
            <Button 
              size="lg" 
              className="btn-hero animate-bounce-in font-semibold px-8 py-3 text-lg"
            >
              {slide.buttonText}
            </Button>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;