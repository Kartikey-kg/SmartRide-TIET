/**
 * backend/scripts/seedRides.js
 * Generates 100 realistic rides (both completed and cancelled) across the past 28 days
 * for presenting the Admin Dashboard, Advanced Analytics Graphs, and ML Server to mentors.
 * 
 * Usage: node backend/scripts/seedRides.js
 */

const { db } = require('../config/firebase');

const CAMPUS_SPOTS = [
  { label: 'Main Entrance', lat: 30.3523, lng: 76.3612 },
  { label: 'Western Gate', lat: 30.3570, lng: 76.3572 },
  { label: 'Library', lat: 30.3535, lng: 76.3637 },
  { label: 'COS Block', lat: 30.3540, lng: 76.3628 },
  { label: 'CS Block', lat: 30.3544, lng: 76.3650 },
  { label: 'Meera Hall (Girls)', lat: 30.3578, lng: 76.3568 },
  { label: 'Hostel J', lat: 30.3564, lng: 76.3582 },
  { label: 'Hostel M', lat: 30.3551, lng: 76.3590 },
  { label: 'Sports Complex', lat: 30.3585, lng: 76.3601 },
  { label: 'Nirvana Food Court', lat: 30.3538, lng: 76.3662 },
  { label: 'Auditorium', lat: 30.3529, lng: 76.3644 },
  { label: 'Mechanical Workshop', lat: 30.3552, lng: 76.3631 },
];

const STUDENTS = [
  { uid: 'jn82FmxYwfShaDuUHFoGdhaSRYz1', name: 'Kartikey Gupta', phone: '9876543210', email: 'kartikeyguptawork2@gmail.com' },
  { uid: 'seed_stud_1', name: 'Aarav Sharma', phone: '9812345671', email: 'aarav.s@thapar.edu' },
  { uid: 'seed_stud_2', name: 'Ananya Verma', phone: '9812345672', email: 'ananya.v@thapar.edu' },
  { uid: 'seed_stud_3', name: 'Rohan Mehta', phone: '9812345673', email: 'rohan.m@thapar.edu' },
  { uid: 'seed_stud_4', name: 'Priya Singh', phone: '9812345674', email: 'priya.s@thapar.edu' },
  { uid: 'seed_stud_5', name: 'Ishaan Patel', phone: '9812345675', email: 'ishaan.p@thapar.edu' },
  { uid: 'seed_stud_6', name: 'Sneha Kapoor', phone: '9812345676', email: 'sneha.k@thapar.edu' },
  { uid: 'seed_stud_7', name: 'Vikram Malhotra', phone: '9812345677', email: 'vikram.m@thapar.edu' },
];

const DRIVERS = [
  {
    uid: 'sqXiM5BYolXB8moAEjwAQQ4zKTl1', // Real registered driver in Firestore
    name: 'Kartikey Gupta',
    phone: '9876543211',
    vehicleNumber: 'PB11-TG-001',
    vehicleType: 'E-Rickshaw (Campus Shuttle)',
  },
  {
    uid: 'driver_harpreet_1',
    name: 'Harpreet Singh',
    phone: '9811223344',
    vehicleNumber: 'PB11-AB-4521',
    vehicleType: 'E-Rickshaw',
  },
  {
    uid: 'driver_rajesh_2',
    name: 'Rajesh Kumar',
    phone: '9811223355',
    vehicleNumber: 'PB11-CD-8890',
    vehicleType: 'E-Rickshaw',
  },
  {
    uid: 'driver_gurmeet_3',
    name: 'Gurmeet Singh',
    phone: '9811223366',
    vehicleNumber: 'PB11-EF-1234',
    vehicleType: 'Campus Auto',
  },
  {
    uid: 'driver_sunil_4',
    name: 'Sunil Verma',
    phone: '9811223377',
    vehicleNumber: 'PB11-GH-6677',
    vehicleType: 'E-Rickshaw',
  },
];

const CANCEL_REASONS = [
  'Driver took too long to arrive',
  'Student changed route plan',
  'Found alternative ride / walked with friends',
  'Booked by mistake',
  'Heavy rain / waited at shelter',
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedRides() {
  console.log('🚀 Starting Seeding of 100 Sample Rides for Admin & ML showcase...');

  // Ensure mock drivers exist in users collection for rich tables
  for (const driver of DRIVERS) {
    const dRef = db.collection('users').doc(driver.uid);
    const dDoc = await dRef.get();
    if (!dDoc.exists) {
      await dRef.set({
        uid: driver.uid,
        name: driver.name,
        email: `${driver.name.toLowerCase().replace(/\s+/g, '')}@smartride.com`,
        phone: driver.phone,
        role: 'driver',
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        isVerified: true,
        isActive: true,
        isAvailable: true,
        rating: +(4.2 + Math.random() * 0.7).toFixed(1),
        totalRides: 0,
        earnings: 0,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      });
      console.log(` Created mock driver: ${driver.name}`);
    }
  }

  const driverStats = {};
  DRIVERS.forEach(d => {
    driverStats[d.uid] = { earnings: 0, rides: 0 };
  });

  const now = new Date();
  const ridesToCreate = [];

  // Generate 100 rides across the last 28 days
  // 82 Completed, 18 Cancelled
  for (let i = 1; i <= 100; i++) {
    // Determine status (82 completed, 18 cancelled)
    const isCompleted = i <= 82;
    const status = isCompleted ? 'completed' : 'cancelled';

    // Distribute timestamps over past 28 days with realistic campus peak hours
    const daysAgo = getRandomInt(0, 27);
    const hour = getRandomElement([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
    const minute = getRandomInt(0, 59);

    const rideDate = new Date(now);
    rideDate.setDate(rideDate.getDate() - daysAgo);
    rideDate.setHours(hour, minute, getRandomInt(0, 59), 0);
    const createdAtStr = rideDate.toISOString();

    // Accepted 1-3 mins after creation
    const acceptedDate = new Date(rideDate.getTime() + getRandomInt(60, 180) * 1000);
    const acceptedAtStr = acceptedDate.toISOString();

    // Completed 6-15 mins after accept, or cancelled 2-5 mins after
    const tripDurationMins = getRandomInt(6, 15);
    const completedDate = new Date(acceptedDate.getTime() + tripDurationMins * 60 * 1000);
    const completedAtStr = isCompleted ? completedDate.toISOString() : null;

    const cancelledDate = new Date(rideDate.getTime() + getRandomInt(120, 400) * 1000);
    const cancelledAtStr = !isCompleted ? cancelledDate.toISOString() : null;

    // Pick locations (make sure pickup != drop)
    const pickup = getRandomElement(CAMPUS_SPOTS);
    let drop = getRandomElement(CAMPUS_SPOTS);
    while (drop.label === pickup.label) {
      drop = getRandomElement(CAMPUS_SPOTS);
    }

    const student = getRandomElement(STUDENTS);
    const driver = getRandomElement(DRIVERS);

    // Realistic campus internal fare ₹10, ₹15, ₹20, ₹25, ₹30, ₹40
    const fare = getRandomElement([10, 10, 15, 20, 20, 25, 30, 35, 40]);
    const distance = +(0.6 + Math.random() * 2.2).toFixed(1);
    const paymentMethod = getRandomElement(['wallet', 'razorpay', 'wallet', 'cash']);

    if (isCompleted) {
      driverStats[driver.uid].earnings += fare;
      driverStats[driver.uid].rides += 1;
    }

    const rideData = {
      studentId: student.uid,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      driverId: driver.uid,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverVehicleNumber: driver.vehicleNumber,
      driverVehicleType: driver.vehicleType,
      pickupLocation: { lat: pickup.lat, lng: pickup.lng },
      dropLocation: { lat: drop.lat, lng: drop.lng },
      pickupAddress: pickup.label,
      dropAddress: drop.label,
      pickup: pickup.label,
      destination: drop.label,
      distance,
      fare,
      durationMinutes: tripDurationMins,
      estimatedTime: `${tripDurationMins} min`,
      isCampusInternal: true,
      status,
      paymentStatus: isCompleted ? 'paid' : 'unpaid',
      paymentMethod: isCompleted ? paymentMethod : null,
      createdAt: createdAtStr,
      updatedAt: isCompleted ? completedAtStr : cancelledAtStr,
      acceptedAt: acceptedAtStr,
      completedAt: completedAtStr,
      cancelledAt: cancelledAtStr,
      cancelledBy: !isCompleted ? (Math.random() > 0.5 ? student.uid : driver.uid) : null,
      cancellationReason: !isCompleted ? getRandomElement(CANCEL_REASONS) : null,
      isSampleData: true,
    };

    ridesToCreate.push(rideData);
  }

  // Insert in Firestore in batches of 50
  console.log(` Inserting ${ridesToCreate.length} rides into Firestore...`);
  const batchSize = 50;
  for (let i = 0; i < ridesToCreate.length; i += batchSize) {
    const chunk = ridesToCreate.slice(i, i + batchSize);
    const batch = db.batch();
    chunk.forEach(ride => {
      const docRef = db.collection('rides').doc();
      batch.set(docRef, ride);
    });
    await batch.commit();
    console.log(`  Committed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ridesToCreate.length / batchSize)}`);
  }

  // Update driver earnings & completed rides in Firestore
  console.log(' Updating driver stats in Firestore users collection...');
  for (const [driverUid, stats] of Object.entries(driverStats)) {
    const dRef = db.collection('users').doc(driverUid);
    const dDoc = await dRef.get();
    if (dDoc.exists) {
      const currentEarnings = dDoc.data().earnings || 0;
      const currentRides = dDoc.data().totalRides || 0;
      await dRef.update({
        earnings: currentEarnings + stats.earnings,
        totalRides: currentRides + stats.rides,
      });
      console.log(`  Driver ${driverUid} updated: +₹${stats.earnings} (${stats.rides} rides)`);
    }
  }

  console.log('\n SUCCESS! 100 sample rides seeded:');
  console.log('   - 82 Completed rides (with realistic fares, wallet/razorpay payments, time distribution)');
  console.log('   - 18 Cancelled rides (with realistic cancellation reasons)');
  console.log('   - Time span: Spread across past 28 days for smooth SVG analytics charts');
  console.log('   - ML server dataset is now rich and ready!');
  process.exit(0);
}

seedRides().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
