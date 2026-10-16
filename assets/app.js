/**
 * TI-84 Plus CE - App Controller
 * Full PWA support, automatic widescreen edge-to-edge scaling, RAM persistence, and haptics
 */

(function () {
  'use strict';

  const BASE_WIDTH = 258;
  const BASE_HEIGHT = 604;

  const scaler = document.getElementById('scaler');
  const calcDiv = document.getElementById('calculatorDiv');

  // --- IndexedDB & LocalStorage RAM Persistence Engine ---
  const DB_NAME = 'TI84_Storage';
  const STORE_NAME = 'ram_store';
  const RAM_KEY = 'latest_ram_state';

  function openDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  function saveToIndexedDB(data) {
    openDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, RAM_KEY);
      } catch (e) {}
    });
  }

  function loadFromIndexedDB() {
    return new Promise((resolve) => {
      openDB().then((db) => {
        if (!db) { resolve(null); return; }
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(RAM_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  // --- RAM Auto-Save Handlers ---
  let saveTimer = null;

  function saveRAMDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveRAMNow, 600);
  }

  function saveRAMNow() {
    if (!window.ti84 || typeof window.ti84.getState !== 'function') return;
    try {
      const state = window.ti84.getState();
      if (state && typeof state === 'string' && state.length > 50000) {
        localStorage.setItem('ti84_saved_ram', state);
        saveToIndexedDB(state);
      }
    } catch (err) {
      console.warn('[TI-84] RAM auto-save warning:', err);
    }
  }

  // --- Sound & Haptics Engine ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playKeyFeedback() {
    try {
      initAudio();
      if (audioCtx && audioCtx.state === 'running') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        const t = audioCtx.currentTime;
        osc.frequency.setValueAtTime(145, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.022);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.022);
      }
    } catch (e) {}

    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  }

  // --- Automatic Full-Screen Edge-to-Edge Stretch ---
  function fitToScreen() {
    if (!scaler || !calcDiv) return;

    const w = window.innerWidth || (window.visualViewport ? window.visualViewport.width : 393);
    const h = window.innerHeight || (window.visualViewport ? window.visualViewport.height : 852);

    const isPhonePortrait = (w <= 600 || w < h) && h > w;

    let scaleX, scaleY, posX, posY;

    if (isPhonePortrait) {
      // Top offset: 45px drops the calculator display just below the iOS Dynamic Island & status bar blur.
      // This places Texas Instruments branding at y≈58px and the LCD mode bar at y≈83px (100% crystal clear with ZERO blur)!
      posY = 45;

      // Bottom margin: 18px ensures the bottom row of buttons (ON, 0, ENTER) has ~35px clearance above the
      // screen bottom, perfectly matching the user's favorite bottom padding from 2 iterations ago!
      const bottomMargin = 18;

      const availH = Math.max(h - posY - bottomMargin, 200);

      scaleY = availH / BASE_HEIGHT;
      // 1.02 multiplier bleeds slightly off the sides for seamless edge-to-edge widescreen
      scaleX = (w / BASE_WIDTH) * 1.02;

      posX = (w - (BASE_WIDTH * scaleX)) / 2;
    } else {
      // Desktop / Landscape / Tablet: keep proportional aspect ratio with comfortable margins
      const maxH = h * 0.94;
      const maxW = w * 0.94;
      scaleY = Math.min(maxH / BASE_HEIGHT, maxW / BASE_WIDTH);
      scaleX = scaleY;

      posX = (w - (BASE_WIDTH * scaleX)) / 2;
      posY = (h - (BASE_HEIGHT * scaleY)) / 2;
    }

    scaler.style.transform = `translate(${posX.toFixed(2)}px, ${posY.toFixed(2)}px) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    scaler.style.opacity = '1';
  }

  // --- Attach Key Listeners for Sounds, Haptics & RAM Auto-Save ---
  function attachKeyListeners() {
    const keys = document.querySelectorAll('.TI84CE [id^="TI84CE_KEY_"], .TI84CE g[id*="_KEY_"]');
    keys.forEach((k) => {
      k.addEventListener('touchstart', () => playKeyFeedback(), { passive: true });
      k.addEventListener('mousedown', () => playKeyFeedback(), { passive: true });
      k.addEventListener('touchend', () => saveRAMDebounced(), { passive: true });
      k.addEventListener('mouseup', () => saveRAMDebounced(), { passive: true });
    });
  }

  // --- Desktop Keyboard Shortcuts ---
  function setupDesktopKeyboard() {
    const keyMap = {
      '0': 'TI84CE_KEY_ZERO_CATALOG_SPACE',
      '1': 'TI84CE_KEY_ONE_L1_Y',
      '2': 'TI84CE_KEY_TWO_L2_Z',
      '3': 'TI84CE_KEY_THREE_L3_THETA',
      '4': 'TI84CE_KEY_FOUR_L4_T',
      '5': 'TI84CE_KEY_FIVE_L5_U',
      '6': 'TI84CE_KEY_SIX_L6_V',
      '7': 'TI84CE_KEY_SEVEN_NONE_O',
      '8': 'TI84CE_KEY_EIGHT_NONE_P',
      '9': 'TI84CE_KEY_NINE_NONE_Q',
      '.': 'TI84CE_KEY_DECIMAL_IMAGINEI_COLON',
      'Enter': 'TI84CE_KEY_ENTER_ENTRY_SOLVE',
      '+': 'TI84CE_KEY_ADD_MEM_QUOTES',
      '-': 'TI84CE_KEY_SUBTRACT_W_BRACKET',
      '*': 'TI84CE_KEY_MULTIPLY_R_BRACKET',
      '/': 'TI84CE_KEY_DIVIDE_E_NONE',
      '(': 'TI84CE_KEY_OPENPAREN_NONE_K',
      ')': 'TI84CE_KEY_CLOSEPAREN_NONE_L',
      'Backspace': 'TI84CE_KEY_CLEAR_NONE_NONE',
      'Delete': 'TI84CE_KEY_DEL_INS_NONE',
      'Escape': 'TI84CE_KEY_ON_OFF_NONE',
      'ArrowUp': 'TI84CE_KEY_ARROW_UP',
      'ArrowDown': 'TI84CE_KEY_ARROW_DOWN',
      'ArrowLeft': 'TI84CE_KEY_ARROW_LEFT',
      'ArrowRight': 'TI84CE_KEY_ARROW_RIGHT'
    };

    window.addEventListener('keydown', (e) => {
      const targetId = keyMap[e.key];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          playKeyFeedback();
          const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          el.dispatchEvent(evt);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const targetId = keyMap[e.key];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          const evt = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          el.dispatchEvent(evt);
          saveRAMDebounced();
        }
      }
    });
  }

  // --- Prevent Mobile Safari Jitter & Gestures ---
  function preventMobileJank() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // --- Initialize Service Worker ---
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          reg.update();
        }).catch((err) => {
          console.warn('[PWA] ServiceWorker warning:', err);
        });
      });
    }
  }

  // --- Boot Sequence ---
  function startCalculator() {
    preventMobileJank();
    initServiceWorker();
    setupDesktopKeyboard();

    window.addEventListener('resize', fitToScreen);
    window.addEventListener('orientationchange', () => {
      setTimeout(fitToScreen, 100);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitToScreen);
    }

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(fitToScreen);
    });
    observer.observe(calcDiv);

    fitToScreen();

    // RAM Auto-Save triggers
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveRAMNow();
    });
    window.addEventListener('pagehide', saveRAMNow);
    window.addEventListener('beforeunload', saveRAMNow);

    try {
      window.ti84 = new TI84PCE({
        ROMLocation: './assets/No_AppsCE.h84statej',
        FaceplateLocation: './assets/TI84CE_touch.svg',
        elementId: 'calculatorDiv'
      });

      const origInit = window.ti84.onInitialized;
      window.ti84.onInitialized = function () {
        if (typeof origInit === 'function') origInit.apply(this, arguments);

        requestAnimationFrame(() => {
          fitToScreen();
          attachKeyListeners();
        });

        if (!localStorage.getItem('ti84_saved_ram')) {
          loadFromIndexedDB().then((saved) => {
            if (saved && typeof window.ti84.setState === 'function') {
              try {
                window.ti84.setState(saved);
                localStorage.setItem('ti84_saved_ram', saved);
              } catch (e) {}
            }
          });
        }
      };
    } catch (err) {
      console.error('[TI-84] Emulator start error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCalculator);
  } else {
    startCalculator();
  }
})();
