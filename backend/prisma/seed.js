const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

const defaultPassword = 'driver123';
const passwordHash = createHash('sha256').update(defaultPassword, 'utf8').digest('hex');

const driversData = [
  {
    name: 'John',
    email: 'driver1@email.com',
    phone: '+44 7700 900001',
    city: 'London',
    car: { model: 'Toyota Corolla', plate: 'AB12 CDE', year: 2022, color: 'Silver' },
    presence: { lat: 51.5074, lon: -0.1278, status: 'available' },
  },
  {
    name: 'Jane',
    email: 'driver2@email.com',
    phone: '+44 7700 900002',
    city: 'London',
    car: { model: 'Honda Civic', plate: 'EF34 FGH', year: 2021, color: 'Blue' },
    presence: { lat: 51.515, lon: -0.142, status: 'available' },
  },
  {
    name: 'Jim',
    email: 'driver3@email.com',
    phone: '+44 7700 900003',
    city: 'Manchester',
    car: { model: 'VW Golf', plate: 'IJ56 KLM', year: 2023, color: 'White' },
    presence: { lat: 53.4808, lon: -2.2426, status: 'offline' },
  },
  {
    name: 'Jill',
    email: 'driver4@email.com',
    phone: '+44 7700 900004',
    city: 'London',
    car: { model: 'Ford Focus', plate: 'NO78 PQR', year: 2020, color: 'Black' },
    presence: { lat: 51.52, lon: -0.1, status: 'available' },
  },
  {
    name: 'Jack',
    email: 'driver5@email.com',
    phone: '+44 7700 900005',
    city: 'Birmingham',
    car: { model: 'Hyundai i30', plate: 'ST90 UVW', year: 2022, color: 'Red' },
    presence: { lat: 52.4862, lon: -1.8904, status: 'available' },
  },
  {
    name: 'Mary',
    email: 'driver6@email.com',
    phone: '+44 7700 900006',
    city: 'London',
    car: { model: 'Kia Ceed', plate: 'XY12 ZAB', year: 2021, color: 'Gray' },
    presence: { lat: 51.51, lon: -0.15, status: 'offline' },
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const d of driversData) {
    const existing = await prisma.driver.findUnique({ where: { email: d.email } });
    if (existing) {
      console.log(`  Skip driver (already exists): ${d.email}`);
      continue;
    }

    const driver = await prisma.driver.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone,
        passwordHash,
        city: d.city,
        car: d.car,
      },
    });

    await prisma.driverPresence.create({
      data: {
        driverId: driver.id,
        lat: d.presence.lat,
        lon: d.presence.lon,
        status: d.presence.status,
      },
    });

    console.log(`  Created driver: ${d.name} (${driver.id})`);
  }

  const allDrivers = await prisma.driver.findMany({
    include: { presence: true },
    orderBy: { createdAt: 'asc' },
  });

  if (allDrivers.length === 0) {
    console.log('  No drivers to create rides for.');
    return;
  }

  const rideSamples = [
    { fromLat: 51.5074, fromLon: -0.1278, toLat: 51.515, toLon: -0.142, price: 12.5, distanceKm: 1.2, durationMin: 8 },
    { fromLat: 51.52, fromLon: -0.1, toLat: 51.51, toLon: -0.15, price: 18.2, distanceKm: 4.5, durationMin: 22 },
    { fromLat: 53.4808, fromLon: -2.2426, toLat: 53.49, toLon: -2.25, price: 8.0, distanceKm: 1.8, durationMin: 7 },
    { fromLat: 52.4862, fromLon: -1.8904, toLat: 52.5, toLon: -1.85, price: 14.3, distanceKm: 3.2, durationMin: 15 },
    { fromLat: 51.505, fromLon: -0.09, toLat: 51.51, toLon: -0.12, price: 9.8, distanceKm: 2.1, durationMin: 11 },
    { fromLat: 51.50, fromLon: -0.14, toLat: 51.53, toLon: -0.08, price: 22.0, distanceKm: 6.0, durationMin: 28 },
    { fromLat: 51.508, fromLon: -0.128, toLat: 51.512, toLon: -0.13, price: 6.5, distanceKm: 0.8, durationMin: 5 },
    { fromLat: 51.49, fromLon: -0.16, toLat: 51.52, toLon: -0.11, price: 16.4, distanceKm: 4.2, durationMin: 20 },
  ];

  const passengerIds = [
    'passenger-seed-001',
    'passenger-seed-002',
    'passenger-seed-003',
    'passenger-seed-004',
    'passenger-seed-005',
  ];

  const createdRides = [];
  for (let i = 0; i < rideSamples.length; i++) {
    const ride = rideSamples[i];
    const driver = allDrivers[i % allDrivers.length];
    const passengerId = passengerIds[i % passengerIds.length];

    const existingRide = await prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        passengerId,
        fromLat: ride.fromLat,
        toLat: ride.toLat,
      },
    });
    if (existingRide) {
      createdRides.push({ id: existingRide.id, driverId: existingRide.driverId, passengerId: existingRide.passengerId });
      continue;
    }

    const newRide = await prisma.ride.create({
      data: {
        driverId: driver.id,
        passengerId,
        status: 'completed',
        fromLat: ride.fromLat,
        fromLon: ride.fromLon,
        toLat: ride.toLat,
        toLon: ride.toLon,
        price: ride.price,
        distanceKm: ride.distanceKm,
        durationMin: ride.durationMin,
      },
    });
    createdRides.push({ id: newRide.id, driverId: newRide.driverId, passengerId: newRide.passengerId });
  }

  console.log(`  Created/found ${createdRides.length} ride(s).`);

  const evaluationSamples = [
    { rating: 5, comment: 'Excellent driver, very polite and on time!' },
    { rating: 4, comment: 'Good ride, clean car.' },
    { rating: 5, comment: null },
    { rating: 3, comment: 'A bit late but okay.' },
    { rating: 5, comment: 'Perfect, will book again.' },
    { rating: 4, comment: 'Smooth ride.' },
    { rating: 5, comment: 'Very professional.' },
    { rating: 4, comment: 'Nice and quick.' },
  ];

  const rideEvaluation = prisma.rideEvaluation;
  let evaluationsCreated = 0;
  try {
    for (let i = 0; i < createdRides.length; i++) {
      const ride = createdRides[i];
      const evalSample = evaluationSamples[i % evaluationSamples.length];
      const existing = await rideEvaluation.findFirst({
        where: { rideId: ride.id },
      });
      if (existing) continue;

      await rideEvaluation.create({
        data: {
          rideId: ride.id,
          passengerId: ride.passengerId,
          driverId: ride.driverId,
          rating: evalSample.rating,
          comment: evalSample.comment,
        },
      });
      evaluationsCreated++;
    }
    console.log(`  Created ${evaluationsCreated} ride evaluation(s).`);
  } catch (e) {
    if (e?.code === 'P2021') {
      console.log('  Skipped ride evaluations (table RideEvaluation not found). Run: npx prisma migrate dev --name add_ride_evaluations');
    } else {
      throw e;
    }
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
