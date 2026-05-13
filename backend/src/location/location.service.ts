import { Injectable, BadRequestException } from '@nestjs/common';
import { ProximityService } from '../proximity/proximity.service';

export interface LocationUpdateDto {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

@Injectable()
export class LocationService {
  constructor(private proximityService: ProximityService) {}

  async updateLocation(dto: LocationUpdateDto) {
    // Rule: Reject accuracy > 50 meters
    if (dto.accuracy > 50) {
      throw new BadRequestException('Accuracy too low for reliable tracking (>50m)');
    }

    // Rule: Ignore stale timestamps (e.g., > 1 minute old)
    const now = Date.now();
    if (now - dto.timestamp > 60000) {
      return { status: 'stale_ignored' };
    }

    // 1. Store latest location in Redis (Simulated)
    await this.saveLatestLocation(dto.userId, dto.latitude, dto.longitude);

    // 2. Fetch friends which have visibility ON
    const friends = await this.getVisibleFriends(dto.userId);

    // 3. Run Proximity Engine
    const events = await this.proximityService.checkProximity(
      dto.userId,
      dto.latitude,
      dto.longitude,
      friends
    );

    // 4. Handle events (Notifications)
    for (const event of events) {
      console.log(`[EVENT] ${dto.userId} -> ${event.type} for friend ${event.friendId}`);
      // Push notification logic would be triggered here
    }

    return { status: 'ok', eventsCount: events.length };
  }

  private async saveLatestLocation(userId: string, lat: number, lng: number) {
    // In production, use Redis: await redis.set(`user:location:${userId}`, JSON.stringify({ lat, lng }))
  }

  private async getVisibleFriends(userId: string) {
    // This would fetch from Prisma database with visibility filters
    // Mocking for MVP
    return [
      { id: 'friend-1', name: 'Alice', lastLocation: { lat: 37.7749, lng: -122.4194 } }
    ];
  }
}
