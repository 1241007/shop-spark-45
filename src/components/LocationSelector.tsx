import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LocationSelector: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<string>('');

  useEffect(() => {
    // Check if we have a saved location
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setCurrentLocation(savedLocation);
    } else {
      setCurrentLocation('Select location');
    }
  }, []);

  return (
    <Link to="/location" className="block">
      <div className="flex items-center space-x-2 px-3 py-2 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer border border-border/50">
        <MapPin className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground block">Deliver to</span>
          <span className="text-sm font-medium text-foreground truncate block">
            {currentLocation || 'Select location'}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </Link>
  );
};

export default LocationSelector;