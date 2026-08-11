const API_BASE = window.location.origin;

const toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 5000) {
    if (!this.container) this.init();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute('role', 'alert');

    const icons = {
      success: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toastEl.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="toast-progress"></div>
    `;

    const closeBtn = toastEl.querySelector('.toast-close');
    const progress = toastEl.querySelector('.toast-progress');

    const remove = () => {
      toastEl.classList.add('toast-exit');
      setTimeout(() => toastEl.remove(), 300);
    };

    closeBtn.addEventListener('click', remove);

    const timer = setTimeout(remove, duration);
    toastEl.addEventListener('mouseenter', () => clearTimeout(timer));
    toastEl.addEventListener('mouseleave', () => {
      setTimeout(remove, duration - (Date.now() - toastEl._startTime));
    });

    toastEl._startTime = Date.now();
    this.container.appendChild(toastEl);

    requestAnimationFrame(() => {
      toastEl.classList.add('toast-enter');
    });

    return remove;
  },

  success(message, duration) {
    return this.show(message, 'success', duration);
  },

  error(message, duration) {
    return this.show(message, 'error', duration);
  },

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

function setLoading(formId, btnId, isLoading) {
  const btn = document.getElementById(btnId);
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');

  btn.disabled = isLoading;
  btnText.hidden = isLoading;
  btnLoader.hidden = !isLoading;
}

document.getElementById('send-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('send-email');
  const email = emailInput.value.trim();

  if (!email || !email.includes('@')) {
    toast.error('Masukkan alamat email yang valid.');
    emailInput.focus();
    return;
  }

  setLoading('send-form', 'send-btn', true);

  try {
    const response = await fetch(`${API_BASE}/api/send-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.status) {
      toast.success(data.message || 'Link verifikasi berhasil dikirim ke email.', 6000);
      emailInput.value = '';
    } else {
      const msg = data.message || 'Gagal mengirim link.';
      const debug = data.debug ? `\nDebug: ${JSON.stringify(data.debug)}` : '';
      toast.error(msg + debug, 7000);
    }
  } catch (error) {
    toast.error('Kesalahan jaringan: ' + error.message, 5000);
  } finally {
    setLoading('send-form', 'send-btn', false);
  }
});

document.querySelectorAll('.faq-question').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.parentElement;
    const wasOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach((faqItem) => {
      faqItem.classList.remove('open');
    });

    if (!wasOpen) {
      item.classList.add('open');
    }
  });
});

document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('verify-email');
  const linkInput = document.getElementById('verify-link');
  const email = emailInput.value.trim();
  const link = linkInput.value.trim();

  if (!email || !email.includes('@')) {
    toast.error('Masukkan alamat email yang valid.');
    emailInput.focus();
    return;
  }

  if (!link || !link.startsWith('http')) {
    toast.error('Masukkan magic link URL yang valid.');
    linkInput.focus();
    return;
  }

  setLoading('verify-form', 'verify-btn', true);

  try {
    const response = await fetch(`${API_BASE}/api/verify-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, link })
    });

    const data = await response.json();

    if (data.status) {
      const message = data.message || 'Lisensi premium berhasil diaktifkan.';
      toast.success(message, 7000);
      linkInput.value = '';
    } else {
      const msg = data.message || 'Verifikasi gagal. Magic link tidak valid atau kadaluarsa.';
      const debug = data.debug ? `\nDebug: ${JSON.stringify(data.debug)}` : '';
      toast.error(msg + debug, 7000);
    }
  } catch (error) {
    toast.error('Kesalahan jaringan: ' + error.message, 5000);
  } finally {
    setLoading('verify-form', 'verify-btn', false);
  }
});
