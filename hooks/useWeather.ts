// ─── useWeather hook ──────────────────────────────────────────────────────────
// Fetches current weather for a destination using WeatherAPI.com
// Returns temperature (C), condition text, and condition icon code.

import { useState, useEffect } from 'react';

const API_KEY = 'd768ffac0d2d4c9ca23181208262806';

export interface WeatherData {
  tempC: number;
  condition: string;
  icon: string; // emoji representation
  isDay: boolean;
}

function conditionToEmoji(code: number, isDay: boolean): string {
  // WeatherAPI condition codes → emoji
  if (code === 1000) return isDay ? '☀️' : '🌙';
  if ([1003].includes(code)) return isDay ? '⛅' : '🌙';
  if ([1006, 1009].includes(code)) return '☁️';
  if ([1030, 1135, 1147].includes(code)) return '🌫️';
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return '🌧️';
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return '❄️';
  if ([1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1249, 1252].includes(code)) return '🌨️';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️';
  return '🌤️';
}

export function useWeather(destination: string | null): {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
} {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) {
      setWeather(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(destination)}&aqi=no`
    )
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error.message);
          setWeather(null);
        } else {
          const current = data.current;
          setWeather({
            tempC: Math.round(current.temp_c),
            condition: current.condition.text,
            icon: conditionToEmoji(current.condition.code, current.is_day === 1),
            isDay: current.is_day === 1,
          });
        }
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [destination]);

  return { weather, loading, error };
}
