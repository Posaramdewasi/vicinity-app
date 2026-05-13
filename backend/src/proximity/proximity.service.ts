import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { getDistance } from 'geolib';

@Injectable()
export class ProximityService {
  private readonly redis: any; // Using any for simplified mock in this environment
  private readonly PROXIMITY_RADIUS = 100; // meters

  constructor() {
    // In a real production app, this would be injected via a RedisModule
    // For this MVP, we simulate the stateful tracking
  }

  /**
   * Core Proximity Engine
   * Detects state transitions: outside -> inside (ENTER) and inside -> outside (EXIT)
   */
  async checkProximity(userId: string, lat: number, lng: number, friends: any[]) {
    const events = [];

    for (const friend of friends) {
      if (!friend.lastLocation) continue;

      const distance = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: friend.lastLocation.lat, longitude: friend.lastLocation.lng }
      );

      const stateKey = `proximity:${userId}:${friend.id}`;
      const wasNearby = await this.getProximityState(stateKey);

      if (distance <= this.PROXIMITY_RADIUS) {
        if (!wasNearby) {
          // Transition: outside -> inside
          await this.setProximityState(stateKey, true);
          events.push({ type: 'ENTER_RADIUS', friendId: friend.id, distance });
        }
      } else {
        if (wasNearby) {
          // Transition: inside -> outside
          await this.setProximityState(stateKey, false);
          events.push({ type: 'EXIT_RADIUS', friendId: friend.id, distance });
        }
      }
    }

    return events;
  }

  // Simulated Redis getters/setters for the purpose of the MVP demonstration
  private proximityState = new Map<string, boolean>();

  private async getProximityState(key: string): Promise<boolean> {
    return this.proximityState.get(key) || false;
  }

  private async setProximityState(key: string, state: boolean) {
    this.proximityState.set(key, state);
  }
}
