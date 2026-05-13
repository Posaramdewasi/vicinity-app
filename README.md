# Vicinity - Real-Time Proximity Social Platform

Vicinity is a high-performance, real-time social platform that uses GPS to connect friends when they are nearby.

## Architecture Highlights
- **Engine**: Haversine-based proximity detection with stateful tracking (Redis).
- **Backend**: NestJS (TypeScript), Prisma ORM, Redis for live state.
- **Mobile**: Flutter (iOS/Android) with background location tracking.
- **Security**: JWT Authentication + Firebase for secure real-time notifications.

## Project Structure
- `/backend`: NestJS source code and Prisma schema.
- `/mobile`: Flutter app source code.
- `/prisma`: Database models.
- `docker-compose.yml`: Full stack orchestration.

## Setup Instructions

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Flutter SDK

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Firebase and JWT secrets
npx prisma generate
npx prisma db push
npm run start:dev
```

### 3. Mobile Setup
```bash
cd mobile
flutter pub get
# Configure Google Maps API Key in AndroidManifest.xml and AppDelegate.swift
flutter run
```

### 4. Running with Docker
```bash
docker-compose up --build
```

## API Testing Examples

### 1. User Location Update
**POST** `/location/update`
```json
{
  "userId": "uuid-v4",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "timestamp": 1690000000000,
  "accuracy": 15.5
}
```

### 2. Proximity Result
The backend will return events if a proximity threshold (100m) is crossed:
```json
{
  "status": "ok",
  "events": [
    {
      "type": "ENTER_RADIUS",
      "friendId": "friend-abc",
      "distance": 45.2
    }
  ]
}
```

## Core Proximity Logic
The system maintains a "proximity state" in Redis for every user-friend pair. 
`ENTER_RADIUS` fires only when toggling from `far` to `near`.
`EXIT_RADIUS` fires only when toggling from `near` to `far`.
This prevents spamming notifications on every GPS ping.
