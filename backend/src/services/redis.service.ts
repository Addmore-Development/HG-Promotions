import { redis } from '../config';

const LOCATION_TTL = 3600; // 1 hour expiry

export interface LiveLocation {
  userId: string;
  lat: number;
  lng: number;
  name?: string;
  timestamp: number;
}


export const setLiveLocation = async (
  userId: string,
  lat: number,
  lng: number,
  name?: string
): Promise<void> => {
  const data: LiveLocation = { userId, lat, lng, name, timestamp: Date.now() };
  await redis.set(`live:${userId}`, JSON.stringify(data), 'EX', LOCATION_TTL);
};


export const clearLiveLocation = async (userId: string): Promise<void> => {
  await redis.del(`live:${userId}`);
};


export const getAllLiveLocations = async (): Promise<LiveLocation[]> => {
  const keys = await redis.keys('live:*');
  if (!keys.length) return [];

  const values = await redis.mget(...keys);
  const locations: LiveLocation[] = [];

  for (const val of values) {
    if (val) {
      try {
        locations.push(JSON.parse(val));
      } catch {
        // skip malformed entries
      }
    }
  }

  return locations;
};
