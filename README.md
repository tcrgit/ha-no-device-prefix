# No Device Prefix (Home Assistant `2026.11+`)

A lightweight frontend patch for Home Assistant **restoring the shorter display labels** to how they appeared in `2026.10.4` and prior versions.

This plugin alters the entity display naming behavior introduced in `2026.11.0` by stripping prepended device names from entity labels on dashboards, entity pickers, and More Info dialogs. This applies **both** to auto-generated dashboards/dashboard cards and to custom dashboard cards without an overriding `name:` field in the YAML for a particular entity (i.e. a specific sensor or switch).

Version 2.1 adds per-device **Opt-Out** and **Opt-In** controls. As a plugin, it defaults to **Opt-Out mode**—all entities with their own sub-name have their prepended device name stripped automatically. **This keep-or-omit behavior can be changed per device or globally.** *(Note: If Home Assistant developers ever consider integrating something like this into HA Core, it would likely need to be an Opt-In feature.)*

---

## Example of Why This Exists

Home Assistant `2026.11` (`frontend#54727` / `frontend#55664`) removed automatic prefix stripping in device entity display contexts, causing long, truncated labels on multi-sensor devices:
* **Before (`2026.11` default):** `GW1000_Pro Indoor Temperatur...`, `GW1000_Pro Indoor Humidity`
* **With No Device Prefix:** `Indoor Temperature`, `Indoor Humidity`

---

## How It Works

* **Presentation-Layer Only:** Intercepts `hass.entities` and `hass.states` in the browser and Companion App; underlying `entity_id`s, SQLite history, and automations remain untouched.
* **Primary-Entity Guard:** Primary or standalone entities whose name *is* the device itself (where the entity has no separate sub-name) retain their device name to prevent generic labels like `Switch` or `Light`.

---

## Installation

1. **Marketplace / HACS (Recommended):**
   * Open **Settings > Marketplace** (or **HACS**), click the **three dots (`...`)** in the top-right corner > **Custom repositories**, and add `https://github.com/tcrgit/ha-no-device-prefix` as an **Integration**.
   * Install **No Device Prefix** and click **Setup** (or restart Home Assistant and add it via **Settings > Devices & Services > + Add Integration** on `2026.10` and older).
2. **Manual:**
   * Copy `custom_components/no_device_prefix` into your `/config/custom_components/` directory and **Restart Home Assistant**.
   * Go to **Settings > Devices & Services > + Add Integration**, search for **No Device Prefix**, and submit.
3. **Clear your frontend cache** (see [Clearing Frontend Cache](#clearing-frontend-cache) below).

---

## Usage & Controls (`v2.1.0+`)

Upon installation, the integration automatically creates two device labels under **Settings > Areas, labels & zones > Labels**: **`keep-prefix`** and **`omit-prefix`**.

### 1. Switching Global Modes (Opt-Out vs. Opt-In)
1. Go to **Settings > Devices & Services** and select **No Device Prefix**.
2. Click the **gear icon (`⚙️`)** (or **Configure**).
3. Toggle **"Opt-In mode only"**:
   * **Unchecked — Opt-Out Mode (Default):** Strips prefixes automatically on all entities that have their own sub-name. Use **`keep-prefix`** on any device whose full name should be preserved (such as generic room sensors).
   * **Checked — Opt-In Mode:** Leaves all names in the post-`2026.11` display format by default. Use **`omit-prefix`** only on noisy multi-sensor devices you want cleaned up.
4. Refresh any open dashboard tabs (`Ctrl + R` or `Cmd + R`) to apply the new mode.

### 2. Applying Labels to Specific Devices
1. Go to **Settings > Devices & Services > Devices** and open the device you want to configure.
2. Click the **pencil icon (`✎`)** in the top-right corner of the device page.
3. Click into the **Labels** dropdown and select **`keep-prefix`** or **`omit-prefix`**, then click **Update**.
4. Refresh your dashboard tab (`Ctrl + R` or `Cmd + R`) to see the updated labels.

*(Tip: If you prefer more descriptive labels or the automatically generated ones do not appear, you can create or use any of the following patterns: `Keep Prefix`, `keep-prefix`, `keep-device-prefix`, `Omit Prefix`, `omit-prefix`, `omit-device-prefix`, `no-prefix`, and `no-device-prefix` all work interchangeably. The plugin's label matching function ignores case, spaces, hyphens, and underscores).*

---

## Clearing Frontend Cache

Whenever you first install the plugin or update to a new version, clear your client cache so the new JavaScript module loads:
* **Desktop Browser:** Hard-refresh the page (`Ctrl + Shift + R` on Windows/Linux, `Cmd + Shift + R` on Mac).
* **iOS / Android Companion App:** Go to **Settings > Companion App > Debugging > Reset frontend cache**, then force-close and reopen the app.

---

## Caveats & Troubleshooting

* **External APIs & InfluxDB:** Because this patch runs in the browser, backend `friendly_name` attributes remain visible to HomeKit, Alexa, Google Assistant, and external InfluxDB integrations (`tags_attributes: friendly_name`). Home Assistant's built-in SQLite Recorder indexes by `entity_id` and is completely unaffected.
* **Troubleshooting:** Open your browser's Developer Tools (`F12` or `Cmd + Option + I`) and check the Console for:
  ```text
  [No Device Prefix] Active (v2.1.0, mode=opt-out).
  ```
