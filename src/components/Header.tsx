import { Search, ShoppingCart, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useProducts } from '@/hooks/useProducts';
import SearchResults from "./SearchResults";
import Cart from "./Cart";
import LocationSelector from "./LocationSelector";
import { useRef, useEffect, useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { searchProducts } = useProducts();
  const searchResults = searchProducts(searchQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSearchQuery]);
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Main header */}
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-primary font-bold text-lg">
                S
              </div>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:block">ShopSpark</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for products, brands and more..."
                className="pl-4 pr-12 py-2 rounded-lg border-border focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                size="sm" 
                className="absolute right-1 top-1 bg-gradient-primary hover:opacity-90"
              >
                <Search className="h-4 w-4" />
              </Button>
          <SearchResults
            query={searchQuery}
            results={searchResults}
            isSearching={false}
            onResultClick={() => setSearchQuery('')}
          />
            </div>
          </div>

          {/* Location and Action buttons */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <LocationSelector />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome back!
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    Register
                  </Button>
                </Link>
              </>
            )}
            <Cart />
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden" ref={searchRef}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-4 pr-12 py-2 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="sm" className="absolute right-1 top-1 bg-gradient-primary">
              <Search className="h-4 w-4" />
            </Button>
            <SearchResults 
              query={searchQuery} 
              results={searchResults} 
              isSearching={false}
              onResultClick={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Mobile Location Selector */}
        <div className="pb-3 sm:hidden">
          <LocationSelector />
        </div>

        {/* Categories Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 py-2 border-t border-border">
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Electronics</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Fashion</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Home & Kitchen</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Sports</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Books</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Beauty</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Mobiles</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;