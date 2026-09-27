import { DisplaySession, CartItem, PaymentMethod } from '../types';

const BROADCAST_CHANNEL_NAME = 'vinisha_pharma_display_sync';
const STORAGE_SYNC_KEY = 'vinisha_display_session_v1';

export const INITIAL_DISPLAY_SESSION: DisplaySession = {
  state: 'idle',
  billNumber: '',
  items: [],
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  grandTotal: 0,
  totalSavings: 0,
  lastUpdated: Date.now()
};

class DisplaySyncService {
  private channel: BroadcastChannel | null = null;
  private sse: EventSource | null = null;
  private currentSession: DisplaySession = INITIAL_DISPLAY_SESSION;
  private listeners: Set<(session: DisplaySession) => void> = new Set();
  private statusListeners: Set<(status: 'connected' | 'reconnecting' | 'offline') => void> = new Set();
  private connectionStatus: 'connected' | 'reconnecting' | 'offline' = 'connected';

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_SYNC_KEY);
        if (stored) {
          this.currentSession = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading display session:', e);
      }

      // Initialize BroadcastChannel for same-browser instant sync
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data && typeof event.data === 'object') {
              this.currentSession = event.data;
              this.notify();
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel not supported in this context:', e);
        }
      }

      // Also listen to storage event for cross-window fallback
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_SYNC_KEY && e.newValue) {
          try {
            this.currentSession = JSON.parse(e.newValue);
            this.notify();
          } catch {
            // ignore
          }
        }
      });

      // Connect to Server-Sent Events (SSE) for secondary displays/remote tablets
      if ('EventSource' in window) {
        this.connectSSE();
      }
    }
  }

  private connectSSE() {
    try {
      this.sse = new EventSource('/api/display/events');
      this.sse.onopen = () => {
        this.connectionStatus = 'connected';
        this.notifyStatus();
      };
      this.sse.onmessage = (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data === 'object') {
              if ((data.lastUpdated || 0) >= (this.currentSession.lastUpdated || 0)) {
                this.currentSession = data;
                this.notify();
              }
            }
          } catch {
            // ignore malformed frame
          }
        }
      };
      this.sse.onerror = () => {
        this.connectionStatus = 'reconnecting';
        this.notifyStatus();
      };
    } catch {
      this.connectionStatus = 'offline';
      this.notifyStatus();
    }
  }

  public subscribeStatus(listener: (status: 'connected' | 'reconnecting' | 'offline') => void): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus() {
    this.statusListeners.forEach(fn => fn(this.connectionStatus));
  }

  public subscribe(listener: (session: DisplaySession) => void): () => void {
    this.listeners.add(listener);
    // Send immediate current state
    listener(this.currentSession);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentSession));
  }

  public getSession(): DisplaySession {
    return this.currentSession;
  }

  private broadcast(session: DisplaySession) {
    this.currentSession = session;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(session));
      } catch (e) {
        console.error('Failed to store sync session', e);
      }

      if (this.channel) {
        try {
          this.channel.postMessage(session);
        } catch (e) {
          console.warn('Failed to postMessage on BroadcastChannel', e);
        }
      }
    }
    this.notify();

    // Also push to server if available
    this.pushToServer(session).catch(() => {});
  }

  private async pushToServer(session: DisplaySession) {
    try {
      await fetch('/api/display/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
    } catch {
      // Offline or dev server mode without endpoint is fine
    }
  }

  // --- Pharmacist Actions to Update Display ---

  // Set to Idle
  public setIdle() {
    this.broadcast({
      ...INITIAL_DISPLAY_SESSION,
      state: 'idle',
      lastUpdated: Date.now()
    });
  }

  // Update cart in real-time
  public updateCart(
    cart: CartItem[], 
    billNumber: string, 
    subtotal: number, 
    discountAmount: number, 
    taxAmount: number, 
    grandTotal: number
  ) {
    // SANITIZE: Never leak purchase price or supplier details!
    const sanitizedItems = cart.map(item => ({
      id: item.batchId,
      medicineName: item.medicineName,
      dosageForm: item.dosageForm,
      strength: item.strength,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      mrp: item.mrp,
      total: item.total,
      savings: item.savings
    }));

    const totalSavings = cart.reduce((sum, item) => sum + item.savings, 0) + discountAmount;

    this.broadcast({
      state: cart.length > 0 ? 'billing' : 'idle',
      billNumber,
      items: sanitizedItems,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      totalSavings,
      lastUpdated: Date.now()
    });
  }

  // Prompt Payment
  public setPaymentPrompt(
    billNumber: string,
    grandTotal: number,
    paymentMethod: PaymentMethod,
    upiId: string,
    payeeName: string
  ) {
    const upiPayload = {
      vpa: upiId,
      payeeName,
      amount: grandTotal,
      transactionNote: `Bill ${billNumber}`
    };

    this.broadcast({
      ...this.currentSession,
      state: 'payment',
      billNumber,
      grandTotal,
      paymentMethod,
      upiDetails: paymentMethod === 'UPI' ? upiPayload : undefined,
      lastUpdated: Date.now()
    });
  }

  // Payment completed / Success screen
  public setPaymentSuccess(
    billNumber: string,
    grandTotal: number,
    paymentMethod: PaymentMethod,
    amountPaid: number,
    changeReturned: number
  ) {
    this.broadcast({
      ...this.currentSession,
      state: 'success',
      billNumber,
      grandTotal,
      paymentMethod,
      amountPaid,
      changeReturned,
      lastUpdated: Date.now()
    });

    // Auto-return to idle after 15 seconds
    setTimeout(() => {
      if (this.currentSession.state === 'success') {
        this.setIdle();
      }
    }, 15000);
  }
}

export const displaySync = new DisplaySyncService();
