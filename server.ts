import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDistance } from 'geolib';

// Mock state for the preview environment
const usersLocations: Record<string, { lat: number; lng: number; lastUpdate: number }> = {};
const proximityState: Record<string, boolean> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "vicinity-proximity-engine" });
  });

  // Location update endpoint
  app.post("/api/location/update", (req, res) => {
    const { userId, latitude, longitude, accuracy, timestamp } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (accuracy > 50) {
      return res.status(400).json({ error: "Accuracy too low" });
    }

    // Save state
    usersLocations[userId] = { lat: latitude, lng: longitude, lastUpdate: timestamp };

    const events: any[] = [];
    const RADIUS = 100;

    // Simulate proximity checks against "known friends"
    // In production, this would query Redis/DB
    const friends = [
      { id: 'friend-1', name: 'Alice', lat: 37.7755, lng: -122.4180 },
      { id: 'friend-2', name: 'Bob', lat: 37.7730, lng: -122.4220 }
    ];

    friends.forEach(friend => {
      const dist = getDistance(
        { latitude, longitude },
        { latitude: friend.lat, longitude: friend.lng }
      );

      const stateKey = `${userId}:${friend.id}`;
      const isNear = dist <= RADIUS;
      const wasNear = proximityState[stateKey] || false;

      if (isNear && !wasNear) {
        proximityState[stateKey] = true;
        events.push({ type: 'ENTER_RADIUS', friendId: friend.id, name: friend.name, distance: dist });
      } else if (!isNear && wasNear) {
        proximityState[stateKey] = false;
        events.push({ type: 'EXIT_RADIUS', friendId: friend.id, name: friend.name, distance: dist });
      }
    });

    res.json({ status: "ok", events });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vicinity Backend running on http://localhost:${PORT}`);
  });
}

startServer();
