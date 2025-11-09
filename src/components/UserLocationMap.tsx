import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Loader2, Navigation, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

/// <reference types="google.maps" />

interface UserLocationMapProps {
  className?: string;
}

const UserLocationMap: React.FC<UserLocationMapProps> = ({ className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          // Try to get address using reverse geocoding if maps are available
          if (map) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                setAddress(results[0].formatted_address);
              } else {
                setAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
              }
            });
          } else {
            setAddress(`Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`);
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Location access denied. Please enable location services or enter manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  const handleManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      setAddress(manualAddress.trim());
      setShowManualInput(false);
      setError('');
    }
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        // Get Google Maps API key from Supabase Edge Function
        const { data, error: secretError } = await supabase.functions.invoke('get-google-maps-key');
        
        if (secretError || !data?.apiKey) {
          console.warn('Google Maps API key not configured. Using fallback location display.');
          setApiKeyMissing(true);
          setLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey: data.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();
        getCurrentLocation();

      } catch (error) {
        console.error('Error loading map:', error);
        setApiKeyMissing(true);
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // Initialize map when userLocation is available and API key exists
  useEffect(() => {
    if (userLocation && !apiKeyMissing && mapRef.current && !map) {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add marker at user's location
      new google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      });

      setMap(mapInstance);
    }
  }, [userLocation, apiKeyMissing, map]);

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Getting your location...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-0">
        {/* Map or Fallback Display */}
        {userLocation && !apiKeyMissing ? (
          <div ref={mapRef} className="w-full h-48 rounded-t-lg" />
        ) : (
          <div className="w-full h-48 bg-secondary/20 rounded-t-lg flex items-center justify-center border-b">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {apiKeyMissing ? 'Maps not configured' : 'Location not available'}
              </p>
            </div>
          </div>
        )}
        
        {/* Address Display and Controls */}
        <div className="p-4">
          {showManualInput ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter your delivery address..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleManualAddressSubmit}
                  disabled={!manualAddress.trim()}
                >
                  Save
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowManualInput(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {address && (
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Deliver to:</span>
                      <p className="text-sm text-muted-foreground">{address}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowManualInput(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex space-x-2">
                {!address || error ? (
                  <Button 
                    size="sm" 
                    onClick={() => setShowManualInput(true)}
                    className="flex-1"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Enter Address
                  </Button>
                ) : null}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="flex items-center space-x-1"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Current Location</span>
                </Button>
              </div>
              
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLocationMap;