// src/services/rideService.js
// Firestore real-time ride listeners — Phase 3 + Campus Fare (Phase 4)

import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';

/**
 * Subscribe to a student's rides in real-time.
 * @param {string} studentId
 * @param {function} callback - called with array of ride objects
 * @returns unsubscribe function
 */
export const subscribeToStudentRides = (studentId, callback) => {
  const q = query(
    collection(db, 'rides'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rides);
  });
};

/**
 * Subscribe to a driver's accepted/ongoing rides in real-time.
 * @param {string} driverId
 * @param {function} callback
 * @returns unsubscribe function
 */
export const subscribeToDriverRides = (driverId, callback) => {
  const q = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rides);
  });
};

/**
 * Subscribe to all pending rides (for driver available rides page).
 * @param {function} callback
 * @returns unsubscribe function
 */
export const subscribeToPendingRides = (callback) => {
  const q = query(
    collection(db, 'rides'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc'),
    limit(30)
  );
  return onSnapshot(q, (snapshot) => {
    const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rides);
  });
};

/**
 * Subscribe to a single ride's updates.
 * @param {string} rideId
 * @param {function} callback
 * @returns unsubscribe function
 */
export const subscribeToRide = (rideId, callback) => {
  const { doc } = require('firebase/firestore');
  return onSnapshot(doc(db, 'rides', rideId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    }
  });
};

/**
 * Calculate haversine distance between two lat/lng points (in km).
 */
export const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculate ride fare based on distance.
 * Campus-internal trips (both endpoints inside TIET): flat ₹10.
 * Off-campus: Base ₹30 + ₹12/km, minimum ₹30.
 * @param {number} distanceKm
 * @param {boolean} [isCampusInternal=false]
 */
export const calcFare = (distanceKm, isCampusInternal = false) => {
  if (isCampusInternal) return 10; // Flat campus fee
  const BASE = 30;
  const PER_KM = 12;
  return Math.max(BASE, Math.round(BASE + distanceKm * PER_KM));
};

/** Format a status string to a human-readable label + color */
export const getRideStatusMeta = (status) => {
  const map = {
    pending:   { label: 'Waiting for driver', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
    accepted:  { label: 'Driver on the way',  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  dot: '#06b6d4' },
    ongoing:   { label: 'Ride in progress',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', dot: '#a78bfa' },
    completed: { label: 'Completed',           color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  dot: '#22c55e' },
    cancelled: { label: 'Cancelled',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444' },
  };
  return map[status] || { label: status, color: '#888', bg: 'rgba(255,255,255,0.05)', dot: '#888' };
};

/** Format createdAt ISO string to readable time */
export const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
