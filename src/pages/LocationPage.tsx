import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Edit3, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const LocationPage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved location
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      setAddress(saved);
    }
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          
          // Simple coordinate display (fallback since Google Maps has issues)
          const locationString = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
          setAddress(locationString);
          setLoading(false);
          
          toast.success('Location detected successfully!');
        },
        (error) => {
          if (import.meta.env.DEV) {
            console.error('Geolocation error:', error);
          }
          toast.error('Location access denied. Please enter manually.');
          setLoading(false);
          setShowManualInput(true);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      setLoading(false);
      setShowManualInput(true);
    }
  };

  const handleSaveAddress = (addressToSave: string) => {
    if (addressToSave.trim()) {
      localStorage.setItem('userLocation', addressToSave.trim());
      toast.success('Address saved successfully!');
      navigate('/');
    }
  };

  const handleManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      setAddress(manualAddress.trim());
      setShowManualInput(false);
      handleSaveAddress(manualAddress.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Choose Delivery Location</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Location Card */}
          <Card className="border-primary/20 bg-gradient-to-r from-card/50 to-primary/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Your Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {address ? (
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Current Address</p>
                      <p className="text-sm text-muted-foreground">{address}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowManualInput(true)}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No location selected yet</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {loading ? 'Getting Location...' : 'Use Current Location'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="flex-1"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Enter Manually
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Input Card */}
          {showManualInput && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Enter Address Manually</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Enter your complete delivery address..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="border-border/50"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleManualAddressSubmit}
                      disabled={!manualAddress.trim()}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Save Address
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowManualInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          {address && !showManualInput && (
            <Button 
              onClick={() => handleSaveAddress(address)}
              className="w-full bg-gradient-primary hover:opacity-90 py-3"
              size="lg"
            >
              Confirm & Continue Shopping
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPage;