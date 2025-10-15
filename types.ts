
export interface AddressDetails {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  postcode?: string;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: AddressDetails;
  boundingbox: string[];
  name?: string; 
}
