# TI-84 Plus CE – Offline iPhone PWA

A high-fidelity Progressive Web App (PWA) emulator for the **Texas Instruments TI-84 Plus CE**, built specifically for iOS Safari Standalone mode with full offline caching, automatic edge-to-edge widescreen scaling, and persistent RAM.

---

## 🚀 Quick Start (Host from Computer)

### 1. Launch the Server
Double-click **`start-calculator.bat`** (or run `npm start` in this folder).

### 2. Connect Your iPhone
1. Ensure your iPhone is connected to the **same Wi-Fi network** as your computer.
2. Point your iPhone camera at the **QR Code** printed in the terminal (or open Safari and go to `https://<your-pc-ip>:8443`).
   > *Note on HTTPS:* Safari requires HTTPS to install offline Progressive Web Apps. If Safari shows "Connection Not Private" due to the local self-signed certificate, tap **Show Details** -> **visit this website**.

### 3. Add to Home Screen
1. In Safari, tap the **Share** button (the square with an arrow pointing up).
2. Scroll down and tap **"Add to Home Screen"**.
3. Tap **"Add"** in the top-right corner.
4. Launch the new **TI-84 CE** icon from your Home Screen! It opens in true full-screen standalone mode without any browser search bars or navigation tabs.

---

## ⚡ What Was Updated & Polished

1. **Pure Calculator Experience (Zero Extra UI)**:
   - Removed all extraneous buttons, floating pills, settings menus, and modals.
   - The entire display is dedicated 100% to the calculator itself.

2. **Automatic Widescreen Scaling**:
   - The calculator automatically expands to fill the phone width with a slight edge-bleed (`1.015×`), ensuring big, comfortable, thumb-friendly buttons.
   - On desktop and tablet monitors, it bounds the width to maintain ergonomic proportions.

3. **Snug Bottom Placement (No Extra Black Void)**:
   - The keypad sits down snugly just above the iOS swipe-up Home Bar, eliminating unnecessary black gaps while preventing accidental app-swipes.

4. **Razor-Sharp Display (No Mode Text Blur)**:
   - Fixed the top blur by changing the iOS status bar style from `black-translucent` to `black`, which prevents iOS from applying its translucent frosted blur scrim over the top screen modes (`NORMAL`, `FLOAT`, `AUTO`, `REAL`, `DEGREE`, etc.).
   - Shifted the screen safely below the Dynamic Island / notch so the top LCD status bar is 100% visible.
   - Enforced `-webkit-optimize-contrast`, `crisp-edges`, and `pixelated` rendering on the LCD canvas.

5. **Persistent RAM Across Instances (No Rewrites Needed)**:
   - Powered by the emulator's built-in `getState()` and `setState()` engine.
   - **Auto-Save**: Automatically saves calculator RAM to `localStorage` and `IndexedDB` whenever you finish typing an equation and whenever you swipe away or close the app.
   - **Instant Boot**: On launch, an interceptor supplies the saved RAM state directly to the emulator engine, so you resume exactly where you left off with every variable, equation, and history item intact.
   - **Native RAM Reset**: To reset RAM back to factory defaults at any time, simply use the standard TI-84 shortcut: `[2nd]` `[MEM]` `[7]` `[1]` `[2]`.

6. **Tactile Key Feedback**:
   - Synthesized mechanical key click via Web Audio API + subtle physical vibration (`navigator.vibrate`) on key presses.

7. **100% Offline Capability**:
   - All emulator files, ROM states, vectors, and stylesheets are cached locally by `sw.js`. Works in full Airplane Mode.
