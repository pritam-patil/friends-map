// src/utils/geocoding.ts

/**
 * Geocodes an address string to latitude and longitude coordinates using the free Nominatim API.
 *
 * IMPORTANT: Nominatim has a usage policy that must be respected.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 * - No heavy uses (max 1 request per second).
 * - Provide a valid HTTP User-Agent or Referer.
 * - Clearly display attribution to OpenStreetMap.
 *
 * @param address The address to geocode (e.g., "1600 Amphitheatre Parkway, Mountain View, CA").
 * @returns A promise that resolves to an object with { lat, lng } or null if not found.
 */
export async function getCoordsFromAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    address
  )}&format=json&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}