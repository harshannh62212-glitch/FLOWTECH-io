// FlowTech Express Backend Server (Render + Supabase + AI Quote Engine)
const express = require('express');
const cors = require('cors');
const path = require('path');
const { supabase } = require('./supabaseClient');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

const DISPATCH_HUB = {
  address: '1231 Meadow Creek Dr',
  city: 'Irving',
  state: 'TX',
  zip: '75038',
  lat: 32.8831,
  lng: -96.9712,
  prepTimeMinutes: 4
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const memoryBookings = [];

function haversineDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateEtaFromHub(destinationAddress, userLat, userLng) {
  let distanceMiles = 3.2;
  
  if (userLat && userLng) {
    const rawDist = haversineDistanceMiles(DISPATCH_HUB.lat, DISPATCH_HUB.lng, parseFloat(userLat), parseFloat(userLng));
    distanceMiles = Math.max(rawDist, 0.4);
  } else if (destinationAddress) {
    const cleanAddr = destinationAddress.toLowerCase().trim();
    let charSum = 0;
    for (let i = 0; i < cleanAddr.length; i++) charSum += cleanAddr.charCodeAt(i);
    distanceMiles = ((charSum % 70) / 10) + 1.2;
  }

  const avgMph = 26;
  const rawDriveMins = Math.round((distanceMiles / avgMph) * 60);
  const prepTimeMins = DISPATCH_HUB.prepTimeMinutes;
  const driveTimeMins = Math.max(rawDriveMins, 4);
  const totalEtaMins = prepTimeMins + driveTimeMins;

  return {
    dispatchHub: DISPATCH_HUB.address,
    prepTimeMins: prepTimeMins,
    driveTimeMins: driveTimeMins,
    totalEtaMins: totalEtaMins,
    distanceMiles: distanceMiles.toFixed(1),
    trafficCondition: distanceMiles > 5 ? 'Moderate Traffic' : 'Optimal Flow'
  };
}

// -------------------------------------------------------------
// AI INTELLIGENT QUOTE GENERATOR API
// -------------------------------------------------------------
app.post('/api/ai-quote', (req, res) => {
  const { description, isUrgent, lat, lng } = req.body;
  const text = (description || '').toLowerCase().trim();

  if (!text) {
    return res.status(400).json({ success: false, error: 'Please provide an issue description.' });
  }

  let diagnosis = 'General Plumbing System Diagnostic';
  let severity = 'MEDIUM';
  let estHours = '1.0 Hour';
  let basePrice = 139;
  let equipment = ['Ultrasonic Acoustic Sensor', 'Pressure Calibration Gauge'];
  let explanation = 'Based on your description, our AI recommends an initial acoustic scan to evaluate pipe integrity and seal condition.';

  // Keyword Classification Rules
  if (text.match(/leak|burst|flood|pooling|wet|dripping|ceiling|wall/)) {
    diagnosis = 'Active Micro-Leak / Pipe Pressure Fracture';
    severity = 'HIGH';
    estHours = '1.5 Hours';
    basePrice = 169;
    equipment = ['Ultrasonic Hydro-Isolation Scan', 'Thermal Imaging Camera', 'Emergency Pipe Clamp'];
    explanation = 'AI Analysis detected risk of active water damage. Immediate acoustic isolation scan is recommended to pinpoint pipe wall fracture without drywall cutting.';
  } else if (text.match(/heater|hot water|cold|boiler|bubbling|tank|pilot/)) {
    diagnosis = 'Water Heater Pressure Relief Valve Anomaly';
    severity = text.includes('bubbling') || text.includes('loud') ? 'CRITICAL' : 'HIGH';
    estHours = '1.5 Hours';
    basePrice = 189;
    equipment = ['TPR Pressure Safety Sensor', 'Digital Thermostat Analyzer', 'Element Replacement Kit'];
    explanation = 'AI Analysis predicts a faulty Temperature-Pressure Relief (TPR) valve or heating element degradation. Emergency depressurization recommended.';
  } else if (text.match(/clog|drain|backed up|gurgling|smell|sewer|overflow|sink|toilet/)) {
    diagnosis = 'Main Drainage Line Restriction & Clog';
    severity = 'MEDIUM';
    estHours = '1.0 Hour';
    basePrice = 129;
    equipment = ['HD Sewer Camera Inspection', 'High-Pressure Hydro-Jetter'];
    explanation = 'AI Analysis detected organic debris or grease buildup in drainage loop. Hydro-jetting recommended to restore 100% flow capacity.';
  }

  const finalQuote = isUrgent !== false ? basePrice : Math.round(basePrice * 0.9);
  const etaData = calculateEtaFromHub('Service Area', lat, lng);

  res.json({
    success: true,
    description: description,
    aiAnalysis: {
      diagnosis: diagnosis,
      severity: severity,
      estimatedLabor: estHours,
      recommendedEquipment: equipment,
      explanation: explanation,
      aiQuote: finalQuote,
      prepTimeMins: etaData.prepTimeMins,
      driveTimeMins: etaData.driveTimeMins,
      totalEtaMins: etaData.totalEtaMins,
      formattedPrice: `$${finalQuote}.00`
    }
  });
});

// Other Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'FlowTech AI Quote Engine & Dispatch',
    timestamp: new Date().toISOString(),
    dispatchHub: DISPATCH_HUB.address,
    backend: 'Render Web Service',
    database: supabase ? 'Supabase Connected' : 'Local Standby'
  });
});

app.get('/api/autocomplete', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const catalog = [
    { label: '1231 Meadow Creek Dr, Irving, TX 75038 (Hub)', address: '1231 Meadow Creek Dr, Irving, TX', lat: 32.8831, lng: -96.9712 },
    { label: '450 N MacArthur Blvd, Irving, TX 75061', address: '450 N MacArthur Blvd, Irving, TX', lat: 32.8910, lng: -96.9590 },
    { label: '7800 N MacArthur Blvd, Irving, TX 75063', address: '7800 N MacArthur Blvd, Irving, TX', lat: 32.9215, lng: -96.9588 },
    { label: '2200 W Airport Fwy, Irving, TX 75062', address: '2200 W Airport Fwy, Irving, TX', lat: 32.8360, lng: -96.9750 },
    { label: '104 Hudson St, New York, NY 10013', address: '104 Hudson St, New York, NY', lat: 40.7180, lng: -74.0090 }
  ];

  if (!query) return res.json(catalog.slice(0, 4));
  const matches = catalog.filter(c => c.label.toLowerCase().includes(query) || c.address.toLowerCase().includes(query));
  if (matches.length === 0) matches.push({ label: `${req.query.q}, Irving, TX`, address: `${req.query.q}, Irving, TX`, lat: 32.8850, lng: -96.9720 });
  res.json(matches);
});

app.post('/api/estimate', (req, res) => {
  const { serviceAddress, serviceType, isUrgent, lat, lng } = req.body;
  const etaData = calculateEtaFromHub(serviceAddress, lat, lng);
  let basePrice = 149;
  if (serviceType && serviceType.includes('Drain')) basePrice = 129;
  if (serviceType && serviceType.includes('Heater')) basePrice = 189;
  if (serviceType && serviceType.includes('Audit')) basePrice = 99;

  const finalPrice = isUrgent !== false ? basePrice : Math.round(basePrice * 0.9);
  res.json({
    success: true,
    address: serviceAddress || '1231 Meadow Creek Dr Area',
    originHub: DISPATCH_HUB.address,
    prepTimeMins: etaData.prepTimeMins,
    driveTimeMins: etaData.driveTimeMins,
    totalEtaMins: etaData.totalEtaMins,
    distanceMiles: etaData.distanceMiles,
    trafficCondition: etaData.trafficCondition,
    estimatedPrice: finalPrice
  });
});

app.post('/api/dispatch', async (req, res) => {
  try {
    const { serviceType, serviceAddress, contactPhone, priority, price, lat, lng, aiNotes } = req.body;
    const etaData = calculateEtaFromHub(serviceAddress, lat, lng);
    const ticketId = `FLW-${Math.floor(10000 + Math.random() * 90000)}`;

    const bookingPayload = {
      ticket_id: ticketId,
      service_type: serviceType || 'AI Custom Diagnostic Repair',
      priority: priority || 'urgent',
      service_address: serviceAddress || '1231 Meadow Creek Dr',
      contact_phone: contactPhone || '(555) 839-2041',
      dispatch_origin: DISPATCH_HUB.address,
      prep_time_mins: etaData.prepTimeMins,
      drive_time_mins: etaData.driveTimeMins,
      total_eta_mins: etaData.totalEtaMins,
      estimated_price: price || 149.00,
      status: 'dispatched',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('bookings').insert([bookingPayload]).select();
      if (!error && data) console.log('[Supabase] Saved AI booking ticket:', ticketId);
      else memoryBookings.push(bookingPayload);
    } else {
      memoryBookings.push(bookingPayload);
    }

    res.status(201).json({
      success: true,
      ticketId: ticketId,
      booking: bookingPayload,
      etaBreakdown: etaData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 FlowTech Server on PORT ${PORT}`);
  console.log(`📍 Hub: 1231 Meadow Creek Dr (${DISPATCH_HUB.lat}, ${DISPATCH_HUB.lng})`);
});
