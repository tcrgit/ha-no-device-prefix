# No Device Prefix (Home Assistant Frontend Patch)

A lightweight frontend patch that restores pre-2026.11 entity display naming behavior in Home Assistant by stripping prepended device names from entity labels on generated automatic dashboards, entity lists, and More Info dialogs—effectively undoing at elast some of the UI display label bugs introduced in **`home-assistant/frontend#54727`** (and discussed in **`frontend#55664`**), where labels are now unreadable and unusable due to the forced concatenation of the device name prior to the entity name/label.

Because this runs entirely in the browser/Companion App presentation layer, your underlying entity IDs, database history, automations, and voice assistant names remain completely untouched. However, it also may not fix some bugs in the 11.0 release creating such problems.

---

## ⚠️ Important Caveats & Warnings

1. **Slightly Aggressive Stripping:** 
   This is a generic, work-in-progress patch and can occasionally be a bit too aggressive—for example, stripping device names from generic single-word sensors (like a bare `Humidity` or `Illuminance` entity) on multi-device Area cards where keeping the device name would have been helpful. This may be the result of some database changes and/or core entity renaming.
2. **No Per Device Toggle Yet:**
   If the HA devs do not address this problem systematically, I may eventually add a per device (or possibly a sensor/switch/entity) toggle to the front end GUI to omit the device name prepending. 
3. **Hold Off on Upgrading to 2026.11.0 (InfluxDB Breaking Bug):** 
   If you have not upgraded yet, **do not upgrade your production system to `2026.11.0`**—and if you already have, consider **rolling back to `2026.10.4`** if you have a backup. Beyond the UI prefix changes, `2026.11.0` introduced a separate, unfixed bug affecting **InfluxDB** caused by automatic device and entity renaming, which can break long-term historical data continuity. 
   *(Note: Because of this InfluxDB issue, I am keeping my own production installation on `2026.10.4` for now, so live testing on `2026.11+` is limited. Pull requests, bug reports, and feedback from those running `2026.11` are very welcome!)*

---

## Installation

### Option 1: Home Assistant Marketplace / HACS (Recommended)

1. Open **Settings > Marketplace** (or **HACS** on `2026.10` and older), click the **three dots** in the top-right corner > **Custom repositories**, and add `https://github.com` as an **Integration**.
2. Click **Install / Download** on **No Device Prefix**:
   * **On `2026.11+` (Marketplace):** Click the **Setup** button (or follow the automatic setup prompt) to enable it immediately—no restart required.
   * **On `2026.10` or older (HACS):** Restart Home Assistant, then go to **Settings > Devices & Services > + Add Integration**, search for **No Device Prefix**, and submit.
3. **Clear your frontend cache:**
   * **Desktop Browser:** Hard-refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`).
   * **iOS / Android Companion App:** Go to **Settings > Companion App > Debugging > Reset frontend cache**, then force-close and reopen the app.

### Option 2: Manual Custom Component

1. Copy the `custom_components/no_device_prefix/` directory into your Home Assistant `/config/custom_components/` folder.
2. Add `no_device_prefix:` to your `configuration.yaml`.
3. **Restart Home Assistant** and clear your browser/Companion App frontend cache as described above.

### Option 3: Standalone Lovelace Resource

1. Copy `custom_components/no_device_prefix/no-device-prefix.js` to `/config/www/no-device-prefix.js`.
2. In Home Assistant, go to **Settings > Dashboards**, click the **three dots** in the top right, and select **Resources**.
3. Click **Add Resource**, enter `/local/no-device-prefix.js`, select **JavaScript Module**, and click **Create**.
4. Hard-refresh your browser or reset your Companion App frontend cache.

---

## Verification

Open your browser's Developer Console (`F12` or `Cmd + Option + I`). You should see:
```text
[No Device Prefix] Universal interceptor active (v2.0).
```

---

## Feedback & Contributions

If you are running `2026.11+` and notice edge cases where prefixes are stripped too aggressively or missed entirely, please open an issue or submit a PR with examples of the entity's `entity_id`, `device.name`, and `friendly_name`.

