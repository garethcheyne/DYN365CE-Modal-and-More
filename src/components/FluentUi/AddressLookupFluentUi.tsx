/**
 * Fluent UI Address Lookup Component
 * Uses SearchBox for address autocomplete with Google Maps or Azure Maps
 */

import React, { useState, useEffect, useRef } from 'react';
import { SearchBox, Field } from '@fluentui/react-components';
import type { SearchBoxProps } from '@fluentui/react-components';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

interface AddressResult {
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface AddressLookupFluentUiProps {
  id?: string;
  label?: string;
  provider: 'google' | 'azure';
  apiKey: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: 'horizontal' | 'vertical';
  componentRestrictions?: { country: string | string[] };
  onSelect?: (address: AddressResult) => void;
  onChange?: (query: string) => void;
}

export const AddressLookupFluentUi: React.FC<AddressLookupFluentUiProps> = ({
  id,
  label,
  provider,
  apiKey,
  placeholder = 'Search for an address...',
  disabled = false,
  required = false,
  orientation = 'horizontal',
  componentRestrictions,
  onSelect,
  onChange,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Search for addresses
  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      let results: AddressResult[] = [];
      
      if (provider === 'google') {
        results = await searchGoogleMaps(searchQuery, apiKey);
      } else {
        results = await searchAzureMaps(searchQuery, apiKey);
      }
      
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Address lookup error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Google Maps API integration using Places Service
  const searchGoogleMaps = async (searchQuery: string, key: string): Promise<AddressResult[]> => {
    return new Promise((resolve) => {
      // Load Google Maps JavaScript API if not already loaded
      if (!window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.onload = () => {
          performSearch();
        };
        document.head.appendChild(script);
      } else {
        performSearch();
      }

      function performSearch() {
        const service = new window.google.maps.places.AutocompleteService();
        
        const request: any = {
          input: searchQuery,
          types: ['address']
        };
        
        // Add country restrictions if provided
        if (componentRestrictions) {
          request.componentRestrictions = componentRestrictions;
        }
        
        service.getPlacePredictions(
          request,
          (predictions: any, status: any) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
              resolve([]);
              return;
            }

            // Get details for each prediction
            const results: AddressResult[] = [];
            let completed = 0;

            predictions.slice(0, 5).forEach((prediction: any) => {
              const placesService = new window.google.maps.places.PlacesService(
                document.createElement('div')
              );

              placesService.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: ['address_components', 'formatted_address', 'geometry']
                },
                (place: any, detailStatus: any) => {
                  if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    const parsed = parseGoogleAddress(place);
                    if (parsed) {
                      results.push(parsed);
                    }
                  }

                  completed++;
                  if (completed === predictions.length) {
                    resolve(results);
                  }
                }
              );
            });
          }
        );
      }
    });
  };

  const parseGoogleAddress = (place: any): AddressResult | null => {
    if (!place) return null;
    
    const components = place.address_components || [];
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let postalCode = '';
    let country = '';
    
    components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) streetNumber = component.long_name;
      else if (types.includes('route')) route = component.long_name;
      else if (types.includes('locality')) city = component.long_name;
      else if (types.includes('administrative_area_level_1')) state = component.long_name;
      else if (types.includes('postal_code')) postalCode = component.long_name;
      else if (types.includes('country')) country = component.long_name;
    });
    
    return {
      formattedAddress: place.formatted_address || '',
      street: `${streetNumber} ${route}`.trim(),
      city,
      state,
      postalCode,
      country,
      latitude: place.geometry?.location?.lat?.() || 0,
      longitude: place.geometry?.location?.lng?.() || 0,
    };
  };

  // Azure Maps API integration
  const searchAzureMaps = async (searchQuery: string, key: string): Promise<AddressResult[]> => {
    const response = await fetch(
      `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(searchQuery)}&subscription-key=${key}&limit=5`
    );
    
    if (!response.ok) {
      throw new Error('Azure Maps API error');
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    return data.results.map((result: any) => parseAzureAddress(result)).filter((r: AddressResult | null): r is AddressResult => r !== null);
  };

  const parseAzureAddress = (result: any): AddressResult | null => {
    if (!result) return null;
    
    const address = result.address || {};
    const position = result.position || {};
    
    return {
      formattedAddress: address.freeformAddress || '',
      street: address.streetName ? `${address.streetNumber || ''} ${address.streetName}`.trim() : '',
      city: address.municipality || address.municipalitySubdivision || '',
      state: address.countrySubdivision || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      latitude: position.lat || 0,
      longitude: position.lon || 0,
    };
  };

  // Handle search input changes with debounce
  const handleSearchChange: SearchBoxProps['onChange'] = (_, data) => {
    const newQuery = data.value;
    setQuery(newQuery);
    
    if (onChange) {
      onChange(newQuery);
    }
    
    // Debounce the search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(newQuery);
    }, 300);
  };

  // Handle address selection
  const handleSelectAddress = (address: AddressResult) => {
    setQuery(address.formattedAddress);
    setShowSuggestions(false);
    
    if (onSelect) {
      onSelect(address);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Field
      label={label}
      required={required}
      orientation={orientation}
      style={{ width: '100%' }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <SearchBox
          id={id}
          placeholder={placeholder}
          value={query}
          onChange={handleSearchChange}
          disabled={disabled}
          appearance="filled-darker"
          style={{ width: '100%' }}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #d2d0ce',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectAddress(suggestion)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f3f2f1' : 'none',
                  fontSize: '14px',
                  color: '#201f1e',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f2f1'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {suggestion.formattedAddress}
              </div>
            ))}
          </div>
        )}
        
        {loading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#605e5c',
          }}>
            Searching...
          </div>
        )}
      </div>
    </Field>
  );
};
