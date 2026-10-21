/**
 * backend/scripts/manageRide.js
 * Manual CLI tool to view, complete, or cancel rides directly in Firestore
 * 
 * Usage:
 *   node backend/scripts/manageRide.js list                 -> View active & recent rides
 *   node backend/scripts/manageRide.js complete <RIDE_ID>   -> Mark a ride as completed (updates driver earnings)
 *   node backend/scripts/manageRide.js cancel <RIDE_ID>     -> Cancel a ride
 */

const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const action = process.argv[2];
const rideId = process.argv[3];

async function main() {
  if (!action || !['list', 'complete', 'cancel'].includes(action)) {
    console.log(`
SmartRide TIET - Manual Ride Manager
------------------------------------
Usage:
  node backend/scripts/manageRide.js list
  node backend/scripts/manageRide.js complete <RIDE_ID>
  node backend/scripts/manageRide.js cancel <RIDE_ID> [reason]
    `);
    process.exit(0);
  }

  if (action === 'list') {
    const snap = await db.collection('rides').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    console.log(`\n📋 Recent Rides (Total: ${all.length}):`);
    console.log('--------------------------------------------------------------------------------------');
    console.log('ID                       | Status    | Student          | Driver           | Fare  | Pickup -> Drop');
    console.log('--------------------------------------------------------------------------------------');
    all.slice(0, 15).forEach(r => {
      const id = r.id.padEnd(24, ' ');
      const status = (r.status || 'unknown').padEnd(9, ' ');
      const student = (r.studentName || 'Student').slice(0, 16).padEnd(16, ' ');
      const driver = (r.driverName || 'None').slice(0, 16).padEnd(16, ' ');
      const fare = `₹${r.fare || 0}`.padEnd(5, ' ');
      const route = `${r.pickupAddress || r.pickup || '?'} -> ${r.dropAddress || r.destination || '?'}`;
      console.log(`${id} | ${status} | ${student} | ${driver} | ${fare} | ${route}`);
    });
    console.log('--------------------------------------------------------------------------------------');
    process.exit(0);
  }

  if (!rideId) {
    console.error('❌ Error: Please provide a Ride ID.');
    process.exit(1);
  }

  const rideRef = db.collection('rides').doc(rideId);
  const rideDoc = await rideRef.get();

  if (!rideDoc.exists) {
    console.error(`❌ Error: Ride with ID "${rideId}" not found in Firestore.`);
    process.exit(1);
  }

  const ride = rideDoc.data();
  const now = new Date().toISOString();

  if (action === 'complete') {
    await rideRef.update({
      status: 'completed',
      paymentStatus: 'paid',
      completedAt: now,
      updatedAt: now,
    });

    if (ride.driverId) {
      const fare = ride.fare || 0;
      await db.collection('users').doc(ride.driverId).update({
        earnings: FieldValue.increment(fare),
        totalRides: FieldValue.increment(1),
      });
      console.log(`✅ Ride ${rideId} marked as COMPLETED.`);
      console.log(`   Updated Driver (${ride.driverName || ride.driverId}): +₹${fare} earnings, +1 total ride.`);
    } else {
      console.log(`✅ Ride ${rideId} marked as COMPLETED.`);
    }
  } else if (action === 'cancel') {
    const reason = process.argv[4] || 'Manually cancelled by admin';
    await rideRef.update({
      status: 'cancelled',
      paymentStatus: 'unpaid',
      cancelledAt: now,
      updatedAt: now,
      cancellationReason: reason,
      cancelledBy: 'manual_admin',
    });
    console.log(`✅ Ride ${rideId} marked as CANCELLED.`);
    console.log(`   Reason: "${reason}"`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Operation failed:', err.message);
  process.exit(1);
});
