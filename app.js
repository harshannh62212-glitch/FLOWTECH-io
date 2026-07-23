// FlowTech Interactive Engine: Username & Password Authentication System
// Central Dispatch Hub: 1231 Meadow Creek Dr

let currentStep = 1;
let selectedService = 'Emergency Pipe Leak';
let basePrice = 149;
let isUrgent = true;
let debounceTimer = null;
let currentGpsCoords = null;

// User Profile State
let activeUser = null;

const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  checkMandatoryAuth();
  fetchBackendHealth();
  updateEstimateBackend();
  startTelemetryTicker();

  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToBooking();
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
});

// -------------------------------------------------------------
// USERNAME & PASSWORD AUTHENTICATION ENGINE
// -------------------------------------------------------------
function checkMandatoryAuth() {
  const saved = localStorage.getItem('flowtech_user_profile');
  const overlay = document.getElementById('mandatoryAuthOverlay');

  if (saved) {
    try {
      activeUser = JSON.parse(saved);
      if (overlay) overlay.style.display = 'none';
      updateUserUI();
      return;
    } catch (e) {}
  }

  if (overlay) overlay.style.display = 'flex';
}

function openAuthOverlay() {
  const overlay = document.getElementById('mandatoryAuthOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function switchAuthTab(mode) {
  const signInForm = document.getElementById('signInForm');
  const registerForm = document.getElementById('registerForm');
  const tabSignIn = document.getElementById('tabBtnSignIn');
  const tabRegister = document.getElementById('tabBtnRegister');
  const errBanner = document.getElementById('authErrorBanner');

  if (errBanner) errBanner.style.display = 'none';

  if (mode === 'signin') {
    signInForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabSignIn.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    registerForm.style.display = 'block';
    signInForm.style.display = 'none';
    tabRegister.classList.add('active');
    tabSignIn.classList.remove('active');
  }
}

async function handleUserSignInSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('signInUsername').value.trim();
  const password = document.getElementById('signInPassword').value.trim();
  const errBanner = document.getElementById('authErrorBanner');

  if (errBanner) errBanner.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    });

    const data = await res.json();
    if (data.success && data.user) {
      activeUser = {
        username: data.user.username,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        address: data.user.address
      };
      saveUserAndUnlock();
    } else {
      if (errBanner) {
        errBanner.textContent = `❌ ${data.error || 'Invalid username or password.'}`;
        errBanner.style.display = 'block';
      }
    }
  } catch (err) {
    // Client offline fallback verification
    if (username.toLowerCase() === 'sarah_connor' && password === 'flowtech2026') {
      executeQuickDemoAuth();
    } else {
      if (errBanner) {
        errBanner.textContent = '❌ Invalid credentials. Try demo username: sarah_connor / pass: flowtech2026';
        errBanner.style.display = 'block';
      }
    }
  }
}

async function handleUserRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const address = document.getElementById('regAddress').value.trim();

  const errBanner = document.getElementById('authErrorBanner');
  if (errBanner) errBanner.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password,
        fullName: fullName,
        email: email,
        phone: phone,
        address: address
      })
    });

    const data = await res.json();
    if (data.success && data.user) {
      activeUser = {
        username: data.user.username,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        address: data.user.address
      };
      saveUserAndUnlock();
    } else {
      if (errBanner) {
        errBanner.textContent = `❌ ${data.error || 'Registration error.'}`;
        errBanner.style.display = 'block';
      }
    }
  } catch (err) {
    activeUser = { username, fullName, email, phone, address };
    saveUserAndUnlock();
  }
}

function executeQuickDemoAuth() {
  document.getElementById('signInUsername').value = 'sarah_connor';
  document.getElementById('signInPassword').value = 'flowtech2026';

  activeUser = {
    username: 'sarah_connor',
    fullName: 'Sarah Connor',
    email: 'sarah@skynet-defense.com',
    phone: '(555) 839-2041',
    address: '450 N MacArthur Blvd, Irving, TX'
  };

  saveUserAndUnlock();
}

function saveUserAndUnlock() {
  localStorage.setItem('flowtech_user_profile', JSON.stringify(activeUser));
  
  const overlay = document.getElementById('mandatoryAuthOverlay');
  if (overlay) overlay.style.display = 'none';

  updateUserUI();
}

function updateUserUI() {
  if (!activeUser) return;

  const label = document.getElementById('userAuthLabel');
  const stripName = document.getElementById('bookingUserName');
  const heroStatus = document.getElementById('heroUserStatus');

  if (label) label.textContent = `👤 ${activeUser.username}`;
  if (stripName) stripName.textContent = `${activeUser.username} (${activeUser.fullName})`;
  if (heroStatus) heroStatus.textContent = activeUser.username.toUpperCase();

  const addressInput = document.getElementById('serviceAddress');
  const phoneInput = document.getElementById('contactPhone');
  if (addressInput && activeUser.address) addressInput.value = activeUser.address;
  if (phoneInput && activeUser.phone) phoneInput.value = activeUser.phone;
}

function openAuthModal() {
  openAuthOverlay();
}

function scrollToBooking() {
  const bookingCard = document.getElementById('booking');
  if (bookingCard) {
    bookingCard.scrollIntoView({ behavior: 'smooth' });
    goToStep(1);
  }
}

async function fetchBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
    }
  } catch (err) {}
}

// -------------------------------------------------------------
// AI CUSTOM ISSUE QUOTE GENERATOR
// -------------------------------------------------------------
async function generateAiQuoteFromText() {
  const textInput = document.getElementById('aiIssueText');
  const text = textInput ? textInput.value.trim() : '';

  if (!text) {
    alert('Please type a description of your plumbing issue.');
    return;
  }

  const resultBox = document.getElementById('aiQuoteResultBox');
  if (resultBox) resultBox.style.display = 'block';

  let diagnosis = 'Active Pipe Leak Anomaly';
  let severity = 'HIGH';
  let estLabor = '1.5 Hours';
  let quote = 169;
  let explanation = 'AI Analysis detected active fluid pressure anomaly. Immediate acoustic isolation scan is recommended.';

  const lower = text.toLowerCase();
  if (lower.includes('heater') || lower.includes('hot water') || lower.includes('bubbling')) {
    diagnosis = 'Water Heater Pressure Relief Valve Anomaly';
    severity = lower.includes('bubbling') ? 'CRITICAL' : 'HIGH';
    estLabor = '1.5 Hours';
    quote = 189;
    explanation = 'AI Analysis predicts a faulty Temperature-Pressure Relief (TPR) valve. Emergency safety depressurization recommended.';
  } else if (lower.includes('clog') || lower.includes('drain') || lower.includes('gurgling') || lower.includes('backed up')) {
    diagnosis = 'Main Drainage Line Restriction & Clog';
    severity = 'MEDIUM';
    estLabor = '1.0 Hour';
    quote = 129;
    explanation = 'AI Analysis detected organic debris in drainage loop. High-pressure hydro-jetting recommended.';
  }

  selectedService = `AI Custom: ${diagnosis}`;
  basePrice = quote;

  document.getElementById('aiDiagnosisTitle').textContent = diagnosis;
  document.getElementById('aiExplanationText').textContent = explanation;
  document.getElementById('aiEstLabor').textContent = estLabor;
  document.getElementById('aiQuoteAmount').textContent = `$${quote}.00`;
  
  const badge = document.getElementById('aiSeverityBadge');
  if (badge) {
    badge.textContent = `SEVERITY: ${severity}`;
    badge.style.color = severity === 'CRITICAL' ? '#ef4444' : severity === 'HIGH' ? '#f59e0b' : '#34d399';
  }

  updateEstimateBackend();
}

async function generateStandaloneAiQuote() {
  const input = document.getElementById('standaloneAiText');
  const text = input ? input.value.trim() : '';

  if (!text) {
    alert('Please enter a description of your issue.');
    return;
  }

  let diagnosis = 'Main Line Pipe Restriction';
  let severity = 'HIGH';
  let estHours = '1.5 Hours';
  let quote = 169;

  const box = document.getElementById('standaloneAiResultBox');
  if (box) {
    box.style.display = 'block';
    box.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 800; color: var(--cyan-neon);">AI DIAGNOSTIC REPORT</div>
        <div style="padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 800; background: rgba(0,243,255,0.15); color: var(--cyan-neon); border: 1px solid var(--cyan-neon);">
          SEVERITY: ${severity}
        </div>
      </div>
      <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">${diagnosis}</h3>
      <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">AI Analysis predicts pipe pressure build-up. Recommended acoustic sensor check.</p>
      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div>
          <div style="font-size: 12px; color: var(--text-muted);">RECOMMENDED DURATION: <strong style="color:#fff;">${estHours}</strong></div>
        </div>
        <div style="font-size: 28px; font-weight: 900; font-family: var(--font-mono); color: var(--cyan-neon);">$${quote}.00</div>
      </div>
      <button class="btn-instant-book" style="width: 100%; margin-top: 18px; justify-content: center;" onclick="bookWithAiQuote('${escapeHtml(diagnosis)}', ${quote})">
        Book Tech With This AI Quote →
      </button>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

function bookWithAiQuote(diagnosis, price) {
  selectedService = `AI Quote: ${diagnosis}`;
  basePrice = price;
  scrollToBooking();
}

function requestUserGpsLocation() {
  const addressInput = document.getElementById('serviceAddress');
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      currentGpsCoords = { lat, lng };
      if (addressInput) addressInput.value = `📍 Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      updateEstimateBackend();
    },
    () => {
      currentGpsCoords = { lat: 32.8910, lng: -96.9590 };
      if (addressInput) addressInput.value = '450 N MacArthur Blvd, Irving, TX';
      updateEstimateBackend();
    }
  );
}

async function handleAddressInput(value) {
  currentGpsCoords = null;
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
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
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
    }
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
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

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

async function updateEstimateBackend() {
  const addressInput = document.getElementById('serviceAddress');
  const userAddr = activeUser ? activeUser.address : '450 MacArthur Blvd, Irving, TX';
  const address = addressInput && addressInput.value ? addressInput.value : userAddr;

  const finalPrice = isUrgent ? basePrice : Math.round(basePrice * 0.9);
  const priceElem = document.getElementById('computedEstimate');
  if (priceElem) priceElem.textContent = `$${finalPrice}.00`;

  try {
    const res = await fetch(`${API_BASE}/api/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceAddress: address,
        serviceType: selectedService,
        isUrgent: isUrgent,
        lat: currentGpsCoords?.lat,
        lng: currentGpsCoords?.lng
      })
    });

    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        document.getElementById('distReadout').textContent = `${data.distanceMiles} Miles from Hub`;
        document.getElementById('prepTimeVal').textContent = `${data.prepTimeMins} Mins`;
        document.getElementById('driveTimeVal').textContent = `${data.driveTimeMins} Mins`;
        document.getElementById('totalEtaVal').textContent = `${data.totalEtaMins} Mins`;
        if (priceElem) priceElem.textContent = `$${data.estimatedPrice}.00`;
      }
    }
  } catch (err) {}
}

// -------------------------------------------------------------
// DISPATCH SUBMISSION LINKED TO USERNAME IDENTITY
// -------------------------------------------------------------
async function submitBooking() {
  if (!activeUser) {
    openAuthOverlay();
    return;
  }

  console.log('[Dispatch] Executing booking dispatch for username:', activeUser.username);

  const addressInput = document.getElementById('serviceAddress');
  const phoneInput = document.getElementById('contactPhone');
  const address = addressInput && addressInput.value ? addressInput.value : activeUser.address || '450 MacArthur Blvd, Irving, TX';
  const phone = phoneInput && phoneInput.value ? phoneInput.value : activeUser.phone || '(555) 839-2041';
  
  const priceElem = document.getElementById('computedEstimate');
  const priceText = priceElem ? priceElem.textContent : '$149.00';
  const priceVal = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 149;

  const totalEtaElem = document.getElementById('totalEtaVal');
  const totalEtaText = totalEtaElem ? totalEtaElem.textContent : '12 Mins';
  const prepTimeElem = document.getElementById('prepTimeVal');
  const prepTimeText = prepTimeElem ? prepTimeElem.textContent : '4 Mins';
  const driveTimeElem = document.getElementById('driveTimeVal');
  const driveTimeText = driveTimeElem ? driveTimeElem.textContent : '8 Mins';

  const ticketId = `FLW-${Math.floor(10000 + Math.random() * 90000)}`;

  const modalTicket = document.getElementById('ticketId');
  const modalCustomer = document.getElementById('modalCustomerName');
  const modalBadge = document.getElementById('modalCustomerBadge');
  const modalService = document.getElementById('modalServiceType');
  const modalPrice = document.getElementById('modalPrice');
  const modalEta = document.getElementById('modalEta');

  if (modalTicket) modalTicket.textContent = ticketId;
  if (modalCustomer) modalCustomer.textContent = activeUser.username || 'sarah_connor';
  if (modalBadge) modalBadge.textContent = `${activeUser.username} (${activeUser.fullName || 'Verified Customer'})`;
  if (modalService) modalService.textContent = selectedService || 'Emergency Pipe Leak';
  if (modalPrice) modalPrice.textContent = `$${priceVal}.00`;
  if (modalEta) modalEta.textContent = `${totalEtaText} (${prepTimeText} prep + ${driveTimeText} drive)`;

  openModal();

  try {
    const payload = {
      serviceType: selectedService || 'Emergency Pipe Leak',
      serviceAddress: address,
      contactPhone: phone,
      customerName: activeUser.fullName || 'Sarah Connor',
      customerUsername: activeUser.username || 'sarah_connor',
      customerEmail: activeUser.email || 'sarah@skynet-defense.com',
      priority: isUrgent ? 'urgent' : 'scheduled',
      price: priceVal,
      lat: currentGpsCoords?.lat,
      lng: currentGpsCoords?.lng
    };

    const res = await fetch(`${API_BASE}/api/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data.success && data.ticketId && modalTicket) {
        modalTicket.textContent = data.ticketId;
      }
    }
  } catch (err) {}
}

function openModal() {
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.add('active');
}

function closeModal() {
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

function startTelemetryTicker() {
  const readout = document.getElementById('pressureReadout');
  if (!readout) return;

  setInterval(() => {
    const psi = (58.2 + Math.random() * 0.6).toFixed(1);
    readout.textContent = `${psi} PSI (STABLE)`;
  }, 3500);
}
