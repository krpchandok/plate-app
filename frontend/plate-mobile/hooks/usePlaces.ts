import { useState, useEffect } from "react";
import { API_URL, GOOGLE_PLACES_KEY } from "../constants/api";

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  rating: number;
  photo?: string;
  lat: number;
  lng: number;
  priceLevel?: number;
};

export function usePlaces(lat: number, lng: number) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearby = async () => {
        try {
            const res = await fetch(`${API_URL}/places/nearby?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            console.log("Places response:", data.status, data.results?.length);
            
            const results: Restaurant[] = (data.results || []).map((place: any) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            priceLevel: place.price_level,
            photo: place.photos?.[0]?.photo_reference
                ? `${API_URL}/places/photo?photo_reference=${place.photos[0].photo_reference}`
                : undefined
            }));

            setRestaurants(results);
        } catch (e) {
            console.error("Places fetch failed:", e);
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
        };
    fetchNearby();
  }, [lat, lng]);

  return { restaurants, loading };
}