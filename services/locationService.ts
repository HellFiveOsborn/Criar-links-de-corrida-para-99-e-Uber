import { NominatimResult } from '../types';

export const fetchAddresses = async (query: string): Promise<NominatimResult[]> => {
  if (query.length < 3) {
    return [];
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=br`
    );
    if (!response.ok) {
      console.error('Network response was not ok');
      return [];
    }
    const data: NominatimResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching address:', error);
    return [];
  }
};
