/**
 * Fluent UI Address Lookup Component
 * Uses fluentui-extended Lookup for address autocomplete with Google Maps or Azure Maps
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Field } from '@fluentui/react-components';
import { Lookup } from 'fluentui-extended';

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

interface AddressLookupOption {
  key: string;
  text: string;
  secondaryText?: string;
  details?: Array<{ label?: string; value: string }>;
  data: AddressResult;
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
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState<AddressLookupOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<AddressLookupOption | null>(null);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      let results: AddressResult[] = [];

      if (provider === 'google') {
        results = await searchGoogleMaps(query, apiKey, componentRestrictions);
      } else {
        results = await searchAzureMaps(query, apiKey);
      }

      const mappedOptions: AddressLookupOption[] = results.map((address, index) => ({
        key: `${address.formattedAddress}-${address.latitude}-${address.longitude}-${index}`,
        text: address.formattedAddress,
        secondaryText: [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
        details: [
          { label: 'Street', value: address.street || '-' },
          { label: 'City', value: address.city || '-' },
          { label: 'State', value: address.state || '-' },
          { label: 'Postal Code', value: address.postalCode || '-' },
          { label: 'Country', value: address.country || '-' },
        ],
        data: address,
      }));

      setOptions(mappedOptions);
    } catch (error) {
      console.error('Address lookup error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (query: string) => {
    const nextQuery = query || '';
    setSearchText(nextQuery);
    onChange?.(nextQuery);

    if (!nextQuery) {
      setSelectedOption(null);
      setOptions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void searchAddress(nextQuery);
    }, 300);
  };

  const headerContent = useMemo(() => {
    return provider === 'google' ? 'Google Address Lookup' : 'Azure Address Lookup';
  }, [provider]);

  const footerContent = useMemo(() => {
    if (loading) {
      return 'Searching...';
    }

    if (searchText.length < 3) {
      return 'Type at least 3 characters';
    }

    return `${options.length} result${options.length === 1 ? '' : 's'}`;
  }, [loading, options.length, searchText]);

  const effectiveOrientation = !label ? 'vertical' : orientation;

  return (
    <Field
      label={label}
      required={required}
      orientation={effectiveOrientation}
      style={{ width: '100%' }}
    >
      <Lookup
        id={id}
        selectedOption={selectedOption}
        options={options}
        placeholder={placeholder}
        appearance="filled-darker"
        disabled={disabled}
        loading={loading}
        clearable
        minSearchLength={3}
        searchDebounceMs={300}
        header={headerContent}
        footer={footerContent}
        onSearchChange={handleSearchChange}
        onOptionSelect={(option: any) => {
          const selected = (option as AddressLookupOption | null) || null;
          setSelectedOption(selected);

          if (selected?.data) {
            onSelect?.(selected.data);
          }
        }}
      />
    </Field>
  );
};

// Google Maps API integration using Places Service
const searchGoogleMaps = async (
  searchQuery: string,
  key: string,
  componentRestrictions?: { country: string | string[] }
): Promise<AddressResult[]> => {
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

          const results: AddressResult[] = [];
          const limitedPredictions = predictions.slice(0, 5);
          let completed = 0;

          limitedPredictions.forEach((prediction: any) => {
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
                if (completed === limitedPredictions.length) {
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

  return data.results
    .map((result: any) => parseAzureAddress(result))
    .filter((result: AddressResult | null): result is AddressResult => result !== null);
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
