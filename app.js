// FlowTech Interactive Engine: Accurate GPS Geolocation & Predictive Address Autocomplete
// Hub Origin: 1231 Meadow Creek Dr (32.8831° N, 96.9712° W)

let currentStep = 1;
let selectedService = 'Emergency Pipe Leak';
let basePrice = 149;
let isUrgent = true;
let debounceTimer = null;
let currentGpsCoords = null; // { lat, lng }

const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  fetchBackendHealth();
  updateEstimateBackend();
  startTelemetryTicker();

  // Modal event listeners
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  // Close address dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('addressSuggestions');
    const input = document.getElementById('serviceAddress');
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.remove('active');
    }
  });
});

// Check Health of Express Backend
async function fetchBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    const badge = document.getElementById('renderHealthBadge');
    if (badge && data.status === 'online') {
      badge.textContent = `Render Backend: Active • Hub: ${data.dispatchHub}`;
    }
  } catch (err) {
    console.log('[Backend] Standby mode');
  }
}

// -------------------------------------------------------------
// HTML5 GEOLOCATION API: Precise GPS Distance Calculation
// -------------------------------------------------------------
function requestUserGpsLocation() {
  const addressInput = document.getElementById('serviceAddress');
  const distReadout = document.getElementById('distReadout');

  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  if (distReadout) distReadout.textContent = 'Acquiring GPS...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      currentGpsCoords = { lat, lng };

      if (addressInput) {
        addressInput.value = `📍 Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }

      // Re-run backend estimate with exact GPS coordinates
      updateEstimateBackend();
    },
    (error) => {
      console.warn('GPS Error or Permission Denied:', error.message);
      // Fallback: Default to local Irving/DFW area coordinates
      currentGpsCoords = { lat: 32.8910, lng: -96.9590 };
      if (addressInput) addressInput.value = '450 N MacArthur Blvd, Irving, TX';
      updateEstimateBackend();
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// -------------------------------------------------------------
// PREDICTIVE ADDRESS AUTOCOMPLETE ENGINE ("Guess as you type")
// -------------------------------------------------------------
async function handleAddressInput(value) {
  currentGpsCoords = null; // Clear manual GPS override when typing text address
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await fetchAddressSuggestions(value);
    updateEstimateBackend();
  }, 250);
}

async function fetchAddressSuggestions(query) {
  const dropdown = document.getElementById('addressSuggestions');
  if (!dropdown) return;

  try {
    const res = await fetch(`${API_BASE}/api/autocomplete?q=${encodeURIComponent(query)}`);
    const suggestions = await res.json();

    if (!suggestions || suggestions.length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    let html = '';
    suggestions.forEach(item => {
      html += `
        <div class="autocomplete-item" onclick="selectSuggestion('${escapeHtml(item.address)}', ${item.lat}, ${item.lng})">
          <i data-lucide="map-pin" style="width: 14px; color: var(--cyan-neon); flex-shrink: 0;"></i>
          <span>${escapeHtml(item.label)}</span>
        </div>
      `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.add('active');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    dropdown.classList.remove('active');
  }
}

function selectSuggestion(addressText, lat, lng) {
  const addressInput = document.getElementById('serviceAddress');
  const dropdown = document.getElementById('addressSuggestions');

  if (addressInput) addressInput.value = addressText;
  if (dropdown) dropdown.classList.remove('active');

  currentGpsCoords = { lat, lng };
  updateEstimateBackend();
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// -------------------------------------------------------------
// STEP FORM & ESTIMATE ENGINE
// -------------------------------------------------------------
function goToStep(step) {
  if (step < 1 || step > 3) return;

  document.querySelectorAll('.step-content').forEach(content => {
    content.classList.remove('active');
  });

  document.querySelectorAll('.step-item').forEach((item, index) => {
    item.classList.remove('active');
    if (index + 1 < step) item.classList.add('completed');
    else item.classList.remove('completed');
  });

  document.getElementById(`step${step}`).classList.add('active');
  document.getElementById(`stepIndicator${step}`).classList.add('active');

  const fill = document.getElementById('progressFill');
  if (fill) {
    if (step === 1) fill.style.width = '0%';
    else if (step === 2) fill.style.width = '50%';
    else if (step === 3) fill.style.width = '100%';
  }

  currentStep = step;
  if (step === 3) updateEstimateBackend();
}

function nextStep(current) {
  if (current < 3) goToStep(current + 1);
}

function selectService(cardElement, type, price) {
  document.querySelectorAll('.radio-card').forEach(card => card.classList.remove('selected'));
  cardElement.classList.add('selected');

  const labelElement = cardElement.querySelector('.radio-label');
  if (labelElement) selectedService = labelElement.textContent.trim();
  basePrice = price;
  updateEstimateBackend();
}

function setPriority(mode) {
  const urgentBtn = document.getElementById('prioUrgent');
  const scheduledBtn = document.getElementById('prioScheduled');
  const dateGroup = document.getElementById('datePickerGroup');

  if (mode === 'urgent') {
    urgentBtn.classList.add('active');
    scheduledBtn.classList.remove('active');
    dateGroup.style.display = 'none';
    isUrgent = true;
  } else {
    scheduledBtn.classList.add('active');
    urgentBtn.classList.remove('active');
    dateGroup.style.display = 'block';
    isUrgent = false;
  }
  updateEstimateBackend();
}

function selectSlot(btnElement) {
  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  btnElement.classList.add('selected');
}

// Send ETA request with GPS coordinates if present
async function updateEstimateBackend() {
  const addressInput = document.getElementById('serviceAddress');
  const address = addressInput ? addressInput.value : '450 MacArthur Blvd, Irving, TX';

  const payload = {
    serviceAddress: address,
    serviceType: selectedService,
    isUrgent: isUrgent
  };

  if (currentGpsCoords) {
    payload.lat = currentGpsCoords.lat;
    payload.lng = currentGpsCoords.lng;
  }

  try {
    const res = await fetch(`${API_BASE}/api/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('distReadout').textContent = `${data.distanceMiles} Miles from Hub`;
      document.getElementById('prepTimeVal').textContent = `${data.prepTimeMins} Mins`;
      document.getElementById('driveTimeVal').textContent = `${data.driveTimeMins} Mins`;
      document.getElementById('totalEtaVal').textContent = `${data.totalEtaMins} Mins`;
      document.getElementById('computedEstimate').textContent = `$${data.estimatedPrice}.00`;
      return data;
    }
  } catch (err) {
    const finalPrice = isUrgent ? basePrice : Math.round(basePrice * 0.9);
    document.getElementById('computedEstimate').textContent = `$${finalPrice}.00`;
  }
}

// Submit Booking Dispatch
async function submitBooking() {
  const addressInput = document.getElementById('serviceAddress');
  const phoneInput = document.getElementById('contactPhone');
  const address = addressInput ? addressInput.value : '450 MacArthur Blvd, Irving, TX';
  const phone = phoneInput ? phoneInput.value : '(555) 839-2041';
  const priceText = document.getElementById('computedEstimate').textContent;
  const totalEtaText = document.getElementById('totalEtaVal').textContent;
  const prepTimeText = document.getElementById('prepTimeVal').textContent;
  const driveTimeText = document.getElementById('driveTimeVal').textContent;

  const payload = {
    serviceType: selectedService,
    serviceAddress: address,
    contactPhone: phone,
    priority: isUrgent ? 'urgent' : 'scheduled',
    price: parseFloat(priceText.replace('$', ''))
  };

  if (currentGpsCoords) {
    payload.lat = currentGpsCoords.lat;
    payload.lng = currentGpsCoords.lng;
  }

  try {
    const res = await fetch(`${API_BASE}/api/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('ticketId').textContent = data.ticketId;
      document.getElementById('modalServiceType').textContent = selectedService;
      document.getElementById('modalPrice').textContent = priceText;
      document.getElementById('modalEta').textContent = `${totalEtaText} (${prepTimeText} prep + ${driveTimeText} drive)`;
      openModal();
    }
  } catch (err) {
    document.getElementById('ticketId').textContent = `#FLW-${Math.floor(10000 + Math.random() * 90000)}`;
    document.getElementById('modalServiceType').textContent = selectedService;
    document.getElementById('modalPrice').textContent = priceText;
    document.getElementById('modalEta').textContent = `${totalEtaText} (${prepTimeText} prep + ${driveTimeText} drive)`;
    openModal();
  }
}

function openModal() {
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.add('active');
}

function closeModal() {
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

function bookForDiagnostic() {
  goToStep(1);
  const heroSection = document.getElementById('hero');
  if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
}

// AI Diagnostic Engine
const diagnosticData = {
  leak: {
    title: 'Micro-Crack Pressure Leak',
    severity: 'SEVERITY: HIGH',
    freq: '14.2 kHz',
    loss: '1.4 Gal / hr',
    desc: 'Recommended Action: Immediate ultrasonic hydro-isolation scan required to pinpoint pipe fracture without cutting drywall.'
  },
  clog: {
    title: 'Main Line Acoustic Restriction',
    severity: 'SEVERITY: MEDIUM',
    freq: '4.8 kHz',
    loss: '0.2 Gal / hr',
    desc: 'Recommended Action: High-pressure hydro-jetting recommended. Organic debris blockage detected in secondary drainage loop.'
  },
  pressure: {
    title: 'PRV Valve Diaphragm Fatigue',
    severity: 'SEVERITY: CRITICAL',
    freq: '22.1 kHz',
    loss: '3.8 Gal / hr',
    desc: 'Recommended Action: Pressure Regulator Valve auto-recalibration or immediate replacement to avoid appliance line damage.'
  }
};

function runDiagnostic(type, btnElement) {
  document.querySelectorAll('.symptom-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  const data = diagnosticData[type];
  if (!data) return;

  document.getElementById('diagResultTitle').textContent = data.title;
  document.getElementById('diagSeverity').textContent = data.severity;
  document.getElementById('diagFreq').textContent = data.freq;
  document.getElementById('diagLoss').textContent = data.loss;
  document.getElementById('diagRecommendation').textContent = data.desc;

  const bars = document.querySelectorAll('.wave-bar');
  bars.forEach(bar => {
    bar.style.animationDuration = `${(Math.random() * 0.8 + 0.4).toFixed(2)}s`;
  });
}

function startTelemetryTicker() {
  const readout = document.getElementById('pressureReadout');
  if (!readout) return;

  setInterval(() => {
    const psi = (58.2 + Math.random() * 0.6).toFixed(1);
    readout.textContent = `${psi} PSI (STABLE)`;
  }, 3500);
}
