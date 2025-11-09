import { Home, User, ShoppingCart, Package, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Cart from "./Cart";

const BottomNavigation = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/", active: location.pathname === "/" },
    { icon: Package, label: "Orders", path: "/orders", active: location.pathname === "/orders" },
    { icon: ShoppingCart, label: "Cart", isCart: true, badge: totalItems > 0 ? totalItems.toString() : undefined },
    { icon: HelpCircle, label: "Help", path: "/help", active: location.pathname === "/help" },
    { icon: User, label: "Profile", path: "/auth", active: location.pathname === "/auth" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const content = (
            <>
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </>
          );
          
          if (item.isCart) {
            return (
              <div key={item.label}>
                <Cart showLabel={true} />
              </div>
            );
          }
          
          return (
            <Link key={item.label} to={item.path!}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center p-2 h-auto relative w-full ${
                  item.active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {content}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;