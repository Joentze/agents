declare module "mapbox-geocoding" {
  interface GeocodeResult {
    type: string;
    query: string[];
    features: Array<{
      id: string;
      type: string;
      place_type: string[];
      relevance: number;
      properties: Record<string, any>;
      text: string;
      place_name: string;
      bbox?: number[];
      center: [number, number];
      geometry: {
        type: string;
        coordinates: [number, number];
      };
      context?: Array<{
        id: string;
        text: string;
        wikidata?: string;
        short_code?: string;
      }>;
    }>;
    attribution: string;
  }

  interface MapboxGeocoding {
    setAccessToken(token: string): void;
    geocode(
      dataset: string,
      query: string,
      callback: (error: Error | null, result: GeocodeResult) => void
    ): void;
    reverseGeocode(
      dataset: string,
      longitude: string,
      latitude: string,
      callback: (error: Error | null, result: GeocodeResult) => void
    ): void;
  }

  const geo: MapboxGeocoding;
  export = geo;
}
