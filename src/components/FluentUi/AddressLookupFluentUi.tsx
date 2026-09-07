/**
 * Fluent UI Address Lookup Component
 * Uses fluentui-extended Lookup for address autocomplete with Google Maps or Azure Maps
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  /** Resolved address - immediate for Azure, fetched on select for Google */
  data?: AddressResult;
  /** Google place id - place details are fetched lazily on selection */
  placeId?: string;
}

const buildAddressDetails = (address: AddressResult) => [
  { label: 'Street', value: address.street || '-' },
  { label: 'City', value: address.city || '-' },
  { label: 'State', value: address.state || '-' },
  { label: 'Postal Code', value: address.postalCode || '-' },
  { label: 'Country', value: address.country || '-' },
];

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
  // Guards against out-of-order async responses overwriting newer results
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const searchAddress = useCallback(
    async (query: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        let mappedOptions: AddressLookupOption[] = [];

        if (provider === 'google') {
          const predictions = await searchGooglePredictions(query, apiKey, componentRestrictions);
          mappedOptions = predictions.map((prediction) => ({
            key: prediction.placeId,
            text: prediction.mainText,
            secondaryText: prediction.secondaryText,
            placeId: prediction.placeId,
          }));
        } else {
          const results = await searchAzureMaps(query, apiKey);
          mappedOptions = results.map((address, index) => ({
            key: `${address.formattedAddress}-${address.latitude}-${address.longitude}-${index}`,
            text: address.formattedAddress,
            secondaryText: [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
            details: buildAddressDetails(address),
            data: address,
          }));
        }

        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setOptions(mappedOptions);
      } catch (error) {
        console.error('Address lookup error:', error);
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setOptions([]);
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [apiKey, componentRestrictions, provider]
  );

  // Lookup already debounces by searchDebounceMs before calling this
  const handleSearchChange = (query: string) => {
    const nextQuery = query || '';
    setSearchText(nextQuery);
    onChange?.(nextQuery);

    if (nextQuery.length < 3) {
      requestIdRef.current++;
      setSelectedOption(null);
      setOptions([]);
      setLoading(false);
      return;
    }

    void searchAddress(nextQuery);
  };

  const handleOptionSelect = (option: AddressLookupOption | null) => {
    setSelectedOption(option);

    if (!option) return;

    if (option.data) {
      onSelect?.(option.data);
      return;
    }

    if (!option.placeId) return;

    setLoading(true);
    fetchGooglePlaceDetails(option.placeId, apiKey)
      .then((address) => {
        if (!address) return;
        if (mountedRef.current) {
          setSelectedOption({ ...option, data: address, details: buildAddressDetails(address) });
        }
        onSelect?.(address);
      })
      .catch((error) => console.error('Address details error:', error))
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
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
        disableClientFilter
        header={headerContent}
        footer={footerContent}
        onSearchChange={handleSearchChange}
        onOptionSelect={(option: any) => handleOptionSelect((option as AddressLookupOption | null) || null)}
      />
    </Field>
  );
};

// Google Maps API integration using Places Service
interface GooglePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

let googleApiPromise: Promise<void> | null = null;

const loadGoogleMapsApi = (apiKey: string): Promise<void> => {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (googleApiPromise) {
    return googleApiPromise;
  }

  googleApiPromise = new Promise<void>((resolve, reject) => {
    const callbackName = 'initGoogleMapsForUiLib';

    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script-uilib';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places&callback=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      googleApiPromise = null;
      script.remove();
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleApiPromise;
};

const searchGooglePredictions = async (
  searchQuery: string,
  key: string,
  componentRestrictions?: { country: string | string[] }
): Promise<GooglePrediction[]> => {
  await loadGoogleMapsApi(key);

  if (!window.google?.maps?.places) {
    throw new Error('Google Places API not available after loading');
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.AutocompleteService();
    const serviceStatus = window.google.maps.places.PlacesServiceStatus;

    const request: any = {
      input: searchQuery,
      types: ['address'],
    };

    if (componentRestrictions) {
      request.componentRestrictions = componentRestrictions;
    }

    service.getPlacePredictions(request, (predictions: any[], status: any) => {
      if (status === serviceStatus.ZERO_RESULTS) {
        resolve([]);
        return;
      }

      if (status !== serviceStatus.OK || !predictions) {
        reject(new Error(`Google Places API error: ${status}`));
        return;
      }

      resolve(
        predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || '',
        }))
      );
    });
  });
};

const fetchGooglePlaceDetails = async (placeId: string, key: string): Promise<AddressResult | null> => {
  await loadGoogleMapsApi(key);

  if (!window.google?.maps?.places) {
    throw new Error('Google Places API not available after loading');
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const serviceStatus = window.google.maps.places.PlacesServiceStatus;

    service.getDetails(
      {
        placeId,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      (place: any, status: any) => {
        if (status === serviceStatus.OK && place) {
          resolve(parseGoogleAddress(place));
          return;
        }

        reject(new Error(`Google Places API error: ${status}`));
      }
    );
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
