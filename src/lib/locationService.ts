export async function searchLocations(query: string): Promise<string[]> {
  if (query.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TravelBuddyApp/1.0 (vlad@travelbuddy.app)',
          'Referer': 'https://travelbuddy.app',
        },
      }
    );
    if (!response.ok) return getFallback(query);
    const data = await response.json();
    if (!data || data.length === 0) return getFallback(query);
    return data.map((item: any) => item.name ?? item.display_name).filter(Boolean);
  } catch {
    return getFallback(query);
  }
}

function getFallback(query: string): string[] {
  const LOCATIONS: Record<string, string[]> = {
    bali: ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua', 'Kuta'],
    java: ['Yogyakarta', 'Jakarta', 'Bromo', 'Ijen', 'Borobudur'],
    lombok: ['Mataram', 'Kuta Lombok', 'Gili Trawangan', 'Gili Air'],
    indonesia: ['Komodo', 'Flores', 'Sumatra'],
    romania: ['Cluj-Napoca', 'București', 'Brașov', 'Sibiu'],
  };
  const q = query.toLowerCase();
  const results: string[] = [];
  for (const [key, locs] of Object.entries(LOCATIONS)) {
    if (q.includes(key) || key.includes(q)) results.push(...locs);
    for (const loc of locs) {
      if (loc.toLowerCase().includes(q) && !results.includes(loc)) results.push(loc);
    }
  }
  return results.slice(0, 6);
}