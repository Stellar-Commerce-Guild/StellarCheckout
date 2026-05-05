export interface CheckoutOptions {
  /** Your StellarCheckout API base URL */
  apiUrl: string;
  /** Payment ID to load */
  paymentId: string;
  /** Container element or CSS selector to mount the iframe into */
  container: string | HTMLElement;
  /** Optional: override iframe height (default: 600px) */
  height?: number;
  /** Callback when payment completes */
  onSuccess?: (txHash: string) => void;
  /** Callback when payment fails */
  onError?: (error: string) => void;
  /** Callback when user closes the checkout */
  onClose?: () => void;
}

export interface StellarCheckoutInstance {
  destroy: () => void;
  open: () => void;
  close: () => void;
}

const IFRAME_STYLES = `
  border: none;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  transition: opacity 0.2s ease;
`;

export function createCheckout(options: CheckoutOptions): StellarCheckoutInstance {
  const { apiUrl, paymentId, container, height = 600, onSuccess, onError, onClose } = options;

  const root = typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)
    : container;

  if (!root) throw new Error(`StellarCheckout: container "${container}" not found`);

  const checkoutUrl = `${apiUrl.replace(/\/$/, '')}/pay/${paymentId}?embed=1`;

  const iframe = document.createElement('iframe');
  iframe.src = checkoutUrl;
  iframe.style.cssText = IFRAME_STYLES;
  iframe.style.height = `${height}px`;
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('title', 'StellarCheckout');

  root.appendChild(iframe);

  function handleMessage(event: MessageEvent) {
    // Only accept messages from our checkout origin
    try {
      const origin = new URL(apiUrl).origin;
      if (event.origin !== origin) return;
    } catch {
      return;
    }

    const { type, data } = event.data || {};
    if (type === 'STELLAR_CHECKOUT_SUCCESS') onSuccess?.(data?.txHash);
    if (type === 'STELLAR_CHECKOUT_ERROR') onError?.(data?.error);
    if (type === 'STELLAR_CHECKOUT_CLOSE') onClose?.();
  }

  window.addEventListener('message', handleMessage);

  return {
    open() { iframe.style.opacity = '1'; iframe.style.pointerEvents = 'auto'; },
    close() { iframe.style.opacity = '0'; iframe.style.pointerEvents = 'none'; onClose?.(); },
    destroy() {
      window.removeEventListener('message', handleMessage);
      iframe.remove();
    },
  };
}

/** Modal variant — renders a full-screen overlay */
export function openCheckoutModal(options: Omit<CheckoutOptions, 'container'>): StellarCheckoutInstance {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  `;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width: 100%; max-width: 480px;';
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  const instance = createCheckout({ ...options, container: wrapper });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) instance.destroy();
  });

  const originalDestroy = instance.destroy.bind(instance);
  return {
    ...instance,
    destroy() {
      originalDestroy();
      overlay.remove();
    },
  };
}

export default { createCheckout, openCheckoutModal };
