import { Home, User, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const BottomNavigation = () => {
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: User, label: "Profile", active: false },
    { icon: ShoppingCart, label: "Cart", active: false, badge: "0" },
    { icon: Menu, label: "Menu", active: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center p-2 h-auto relative ${
                item.active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <span className="absolute top-0 right-2 bg-accent text-accent-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;