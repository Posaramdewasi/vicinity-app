/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Users, 
  Bell, 
  Shield, 
  Smartphone, 
  Database, 
  Activity,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Radio,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDistance } from 'geolib';

// --- Mock Data & Logic ---

interface User {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const INITIAL_USERS: User[] = [
  { id: 'me', name: 'Me (You)', lat: 37.7749, lng: -122.4194, color: 'rgb(59, 130, 246)' },
  { id: 'friend-1', name: 'Alice', lat: 37.7755, lng: -122.4180, color: 'rgb(16, 185, 129)' },
  { id: 'friend-2', name: 'Bob', lat: 37.7730, lng: -122.4220, color: 'rgb(245, 158, 11)' },
];

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeProximities, setActiveProximities] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  
  const logCounter = useRef(0);
  const notificationCounter = useRef(0);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: ++logCounter.current,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const addNotification = (text: string) => {
    const id = ++notificationCounter.current;
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // --- Proximity Engine Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate User Movement
      setUsers(prev => {
        const myUser = prev.find(u => u.id === 'me')!;
        // Slightly random walk
        const newLat = myUser.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = myUser.lng + (Math.random() - 0.5) * 0.0005;

        // Check proximity logic (The "Engine")
        prev.forEach(u => {
          if (u.id === 'me') return;

          const dist = getDistance(
            { latitude: newLat, longitude: newLng },
            { latitude: u.lat, longitude: u.lng }
          );

          const proximityKey = `me:${u.id}`;
          const isNear = dist <= 100;

          if (isNear && !activeProximities[proximityKey]) {
            // ENTER_RADIUS
            setActiveProximities(cur => ({ ...cur, [proximityKey]: true }));
            addLog(`[PROXIMITY] ENTER: ${u.name} is now within 100m (${dist}m)`, 'success');
            addNotification(`${u.name} is nearby!`);
          } else if (!isNear && activeProximities[proximityKey]) {
            // EXIT_RADIUS
            setActiveProximities(cur => ({ ...cur, [proximityKey]: false }));
            addLog(`[PROXIMITY] EXIT: ${u.name} is now beyond 100m (${dist}m)`, 'warning');
            addNotification(`${u.name} left your vicinity.`);
          }
        });

        return prev.map(u => u.id === 'me' ? { ...u, lat: newLat, lng: newLng } : u);
      });

      addLog('Location update synced to backend cluster', 'info');
    }, 3000);

    return () => clearInterval(interval);
  }, [activeProximities]);

  const handleSOS = () => {
    addLog('CRITICAL: SOS ALERT BROADCASTED', 'error');
    addNotification('🚨 SOS Sent to friends!');
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">VICINITY</h1>
            <p className="text-xs text-neutral-500 font-mono">MVP STATUS: ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSOS}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-red-900/40"
          >
            <AlertTriangle className="w-4 h-4" />
            SOS
          </button>
        </div>
      </nav>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* Left Column: Live Map Simulation */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-neutral-800/50 border border-white/10 rounded-2xl aspect-video relative group overflow-hidden">
            {/* Map Canvas Background Substitute */}
            <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
            
            {/* Map UI Overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold">LIVE GPS STREAMING</span>
            </div>

            {/* Simulated Users on Map */}
            <div className="absolute inset-0 overflow-hidden">
              {users.map(user => (
                <motion.div
                  key={user.id}
                  animate={{ 
                    x: (user.lng + 122.425) * 50000, 
                    y: (user.lat - 37.77) * -50000 
                  }}
                  transition={{ type: 'spring', stiffness: 50 }}
                  className="absolute"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="relative group -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/40 transition-all" />
                    <div className="relative flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full border-4 border-neutral-900 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.id === 'me' ? <Smartphone className="w-5 h-5" /> : <Users className="w-5 h-5 text-white" />}
                      </div>
                      <span className="mt-2 text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                        {user.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Proximity Radius Ring around 'Me' */}
            <motion.div
              animate={{ 
                x: (users.find(u => u.id === 'me')!.lng + 122.425) * 50000, 
                y: (users.find(u => u.id === 'me')!.lat - 37.77) * -50000 
              }}
              className="absolute left-1/2 top-1/2 w-[200px] h-[200px] -ml-[100px] -mt-[100px] border-2 border-indigo-500/20 rounded-full pointer-events-none bg-indigo-500/5 backdrop-blur-[1px] transform transition-transform"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              icon={<MapPin className="text-blue-400" />}
              label="Proximity Radius"
              value="100 Meters"
              sub="Dynamic Threshold"
            />
            <StatsCard 
              icon={<Zap className="text-amber-400" />}
              label="Sync Rate"
              value="5 Seconds"
              sub="Mobile Pings"
            />
            <StatsCard 
              icon={<UserCheck className="text-green-400" />}
              label="Active Friends"
              value="2 Online"
              sub="Visible Nearby"
            />
          </div>
        </section>

        {/* Right Column: Backend & Log Stream */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-140px)]">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold font-mono">BACKEND_LOG_STREAM</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400/20" />
                <div className="w-2 h-2 rounded-full bg-amber-400/20" />
                <div className="w-2 h-2 rounded-full bg-green-400/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence initial={false}>
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group"
                  >
                    <span className="text-neutral-600 shrink-0">{log.timestamp}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-neutral-300'
                    }>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Activity className="w-12 h-12 text-indigo-500/20" />
             </div>
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Architecture
             </h3>
             <ul className="space-y-4 text-sm text-neutral-400">
               <li className="flex items-start gap-3">
                 <div className="mt-1 flex-shrink-0 w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                 </div>
                 <span><strong>Redis:</strong> Geospatial indices for O(1) distance lookups.</span>
               </li>
               <li className="flex items-start gap-3">
                 <div className="mt-1 flex-shrink-0 w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                 </div>
                 <span><strong>FCM:</strong> Push alerts for transition events.</span>
               </li>
               <li className="flex items-start gap-3">
                 <div className="mt-1 flex-shrink-0 w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                 </div>
                 <span><strong>Prisma:</strong> Relational integrity for friend graphs.</span>
               </li>
             </ul>
          </div>
        </section>
      </main>

      {/* Floating Notifications UI Simulation */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 pointer-events-none z-[100]">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto border border-white/20 min-w-[300px]"
            >
              <Bell className="w-6 h-6 animate-[bounce_1s_infinite]" />
              <div className="flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Vicinity Alert</span>
                <span className="text-sm font-semibold">{n.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-neutral-800/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-[10px] text-neutral-500 font-mono uppercase">{sub}</div>
      </div>
    </div>
  );
}
