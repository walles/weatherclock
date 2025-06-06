export type WeatherLocation = {
  latitude: number;
  longitude: number;
};

/** Converts degrees to radians. */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Returns a fixed position from the URL query parameters, or null if not set or invalid.
 */
export function getFixedPosition(): WeatherLocation | null {
  const params = new URLSearchParams(window.location.search);
  const latitude = params.get('latitude');
  const longitude = params.get('longitude');

  if (!latitude && !longitude) {
    console.log('Set fixed position with query parameters ?latitude=...&longitude=...');
    return null;
  }

  if (!(latitude && longitude)) {
    console.error(
      `Fixed position is missing one number: latitude=${latitude}, longitude=${longitude}`,
    );
    return null;
  }

  const latitudeNumber = parseFloat(latitude);
  const longitudeNumber = parseFloat(longitude);
  if (Number.isNaN(latitudeNumber) || Number.isNaN(longitudeNumber)) {
    console.error(
      `Fixed position must get two numbers, not this: latitude=${latitude}, longitude=${longitude}`,
    );
    return null;
  }

  console.log(`Using fixed position: latitude=${latitudeNumber}, longitude=${longitudeNumber}`);
  return {
    latitude: latitudeNumber,
    longitude: longitudeNumber,
  };
}

/**
 * Calculates the distance in kilometers between two latitude/longitude points.
 */
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Requests the user's current position using the browser geolocation API.
 * Returns a Promise that resolves to a WeatherLocation or rejects with an error.
 */
export function getCurrentPosition(): Promise<WeatherLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
    );
  });
}
