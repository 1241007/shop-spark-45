import { Smartphone, Laptop, Shirt, Home, Book, Gamepad2, Car, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const CategorySection = () => {
  const navigate = useNavigate();
  
  const categories = [
    { name: "Electronics", icon: Laptop, color: "text-purple-500" },
    { name: "Fashion", icon: Shirt, color: "text-pink-500" },
    { name: "Home & Kitchen", icon: Home, color: "text-green-500" },
    { name: "Books", icon: Book, color: "text-orange-500" },
    { name: "Sports", icon: Gamepad2, color: "text-red-500" },
    { name: "Beauty", icon: Gift, color: "text-yellow-500" },
  ];

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/category/${categoryName.toLowerCase()}`);
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Shop by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.name} 
                className="product-card cursor-pointer hover:shadow-md group"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="p-3 rounded-full bg-secondary group-hover:bg-gradient-primary group-hover:text-white transition-all duration-300">
                      <IconComponent className={`h-6 w-6 ${category.color} group-hover:text-white`} />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;