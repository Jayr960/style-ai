import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  description: string;
  icon: string;
  city: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lng: number) => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-weather", {
          body: { lat, lng },
        });
        if (fnError) throw fnError;
        setWeather(data as WeatherData);
      } catch (e: any) {
        console.error("Weather fetch error:", e);
        setError(e.message || "Failed to fetch weather");
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          setError("Location access denied");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }
  }, []);

  return { weather, loading, error };
}
