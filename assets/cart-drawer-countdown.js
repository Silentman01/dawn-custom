/**
 * Cart Drawer Countdown Timer
 *
 * Web Component <cart-drawer-countdown> with a singleton timer manager.
 * Stores expiry in sessionStorage so it survives AJAX re-renders
 * (Section Rendering API destroys and recreates DOM).
 * connectedCallback re-attaches the timer after each re-render.
 */

const CartCountdownManager = (() => {
  const STORAGE_KEY = 'cart_drawer_countdown_expiry';
  let intervalId = null;
  let activeElement = null;

  function getExpiry() {
    const val = sessionStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) : null;
  }

  function setExpiry(timestamp) {
    sessionStorage.setItem(STORAGE_KEY, timestamp.toString());
  }

  function clearExpiry() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function startTimer(element) {
    activeElement = element;
    const durationMinutes = parseInt(element.dataset.duration, 10) || 10;

    if (!getExpiry()) {
      setExpiry(Date.now() + durationMinutes * 60 * 1000);
    }

    if (intervalId) clearInterval(intervalId);
    tick();
    intervalId = setInterval(tick, 1000);
  }

  function tick() {
    if (!activeElement || !activeElement.isConnected) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    const expiry = getExpiry();
    if (!expiry) return;

    const remainingMs = expiry - Date.now();
    const display = activeElement.querySelector('[data-countdown-display]');
    if (!display) return;

    if (remainingMs <= 0) {
      display.textContent = '00:00';
      const expiredMsg = activeElement.dataset.expiredMessage;
      if (expiredMsg) {
        const textEl = activeElement.querySelector('.cart-drawer-countdown__text');
        if (textEl) textEl.innerHTML = '<p>' + expiredMsg + '</p>';
      }
      activeElement.classList.add('cart-drawer-countdown--expired');
      clearInterval(intervalId);
      intervalId = null;
      clearExpiry();
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    display.textContent =
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  function detach() {
    activeElement = null;
  }

  return { startTimer, detach };
})();

if (!customElements.get('cart-drawer-countdown')) {
  class CartDrawerCountdown extends HTMLElement {
    connectedCallback() {
      CartCountdownManager.startTimer(this);
    }

    disconnectedCallback() {
      CartCountdownManager.detach();
    }
  }

  customElements.define('cart-drawer-countdown', CartDrawerCountdown);
}
