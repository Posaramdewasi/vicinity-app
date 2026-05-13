import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SosService {
  constructor(private notificationService: NotificationService) {}

  async broadcastSos(userId: string, lat: number, lng: number) {
    // 1. Fetch user's emergency contacts from DB
    const contacts = await this.getEmergencyContacts(userId);

    // 2. Prepare payload
    const payload = {
      title: 'EMERGENCY - Vicinity SOS',
      body: `Your friend needs help! Real-time location: ${lat}, ${lng}`,
      data: {
        type: 'SOS',
        userId,
        lat: lat.toString(),
        lng: lng.toString()
      }
    };

    // 3. Send Push Notifications via FCM
    for (const contact of contacts) {
      await this.notificationService.sendToUser(contact.id, payload);
    }

    return { status: 'broadcasted', count: contacts.length };
  }

  private async getEmergencyContacts(userId: string) {
    // Mock logic: in production, queries Prisma for specific relationship types
    return [
      { id: 'friend-1', deviceToken: 'token-abc' }
    ];
  }
}
