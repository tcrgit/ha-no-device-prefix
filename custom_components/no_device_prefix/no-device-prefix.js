/**
 * Home Assistant Frontend Plugin: No Device Prefix (v2.1.0)
 * Restores pre-2026.11 entity naming behavior by preventing redundant
 * device name concatenation on device entities while preserving
 * standalone device names.
 *
 * Supported Device Labels (spaces, hyphens, underscores, or none):
 *   - Keep prefix : keep-prefix, keep-device-prefix (and spaced/underscored equivalents)
 *   - Omit prefix : omit-prefix, omit-device-prefix, no-prefix, no-device-prefix
 */
(function () {
  const PLUGIN_NAME = "No Device Prefix";
  const STORAGE_KEY = "ndp_opt_in_mode";

  const KEEP_LABELS = new Set([
    "keepprefix",
    "keepdeviceprefix",
  ]);

  const OMIT_LABELS = new Set([
    "omitprefix",
    "omitdeviceprefix",
    "noprefix",
    "nodeviceprefix",
  ]);

  let optInMode = localStorage.getItem(STORAGE_KEY) === "true";

  function normalizeLabel(label) {
    return String(label).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function stripLiteralPrefix(text, prefixes) {
    if (!text) return text;
    for (const prefix of prefixes) {
      if (prefix && text.startsWith(prefix) && text.length > prefix.length) {
        const remainder = text.substring(prefix.length).replace(/^[\s\-:_]+/, "").trim();
        if (remainder.length > 0) {
          return remainder.charAt(0).toUpperCase() + remainder.slice(1);
        }
      }
    }
    return text;
  }

  function cleanHassData(hass) {
    if (!hass || !hass.states || !hass.devices) return;

    const entities = hass.entities;
    const devices = hass.devices;
    const states = hass.states;

    for (const entityId in states) {
      const entityMeta = entities?.[entityId];
      if (!entityMeta?.device_id) continue;

      const device = devices[entityMeta.device_id];
      if (!device) continue;

      const labels = (device.labels || []).map(normalizeLabel);
      const hasKeep = labels.some((l) => KEEP_LABELS.has(l));
      const hasOmit = labels.some((l) => OMIT_LABELS.has(l));

      // 1. Explicit keep label always wins
      if (hasKeep) {
        continue;
      }

      // 2. In Opt-In mode, skip any device that lacks an omit/no-prefix label
      if (optInMode && !hasOmit) {
        continue;
      }

      const deviceNames = [device.name_by_user, device.name].filter(Boolean);
      if (deviceNames.length === 0) continue;

      const stateObj = states[entityId];
      const rawFriendly = stateObj?.attributes?.friendly_name || "";
      const rawMetaName = entityMeta.name || entityMeta.original_name;

      // 3. Protect standalone single-entity devices unless explicitly forced via label
      if (!hasOmit && !rawMetaName && deviceNames.includes(rawFriendly)) {
        continue;
      }

      // 4. Strip literal device prefix if baked into friendly_name or entity name
      const cleanedFriendly = stripLiteralPrefix(rawFriendly, deviceNames);
      if (cleanedFriendly !== rawFriendly && stateObj?.attributes) {
        stateObj.attributes = {
          ...stateObj.attributes,
          friendly_name: cleanedFriendly,
        };
      }

      const cleanedMetaName = rawMetaName
        ? stripLiteralPrefix(rawMetaName, deviceNames)
        : rawMetaName;

      // 5. Disable 2026.11's automatic device prefix concatenation (next_name_part)
      if (
        cleanedMetaName !== rawMetaName ||
        entityMeta.next_name_part === "device"
      ) {
        entities[entityId] = {
          ...entityMeta,
          name: cleanedMetaName,
          original_name: cleanedMetaName,
          next_name_part: undefined,
        };
      }
    }
  }

  async function syncSettings(main) {
    try {
      const resp = await fetch("/no_device_prefix/settings.json", {
        cache: "no-store",
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const serverOptIn = Boolean(data.opt_in_mode);

      if (serverOptIn !== optInMode) {
        optInMode = serverOptIn;
        localStorage.setItem(STORAGE_KEY, String(optInMode));
        if (main?.hass) {
          cleanHassData(main.hass);
          main.requestUpdate("hass");
        }
      }
    } catch (err) {
      console.warn(`[${PLUGIN_NAME}] Could not fetch settings:`, err);
    }
  }

  function patchHass(main) {
    if (!main || main.__noDevicePrefixPatched) return;

    let proto = main;
    let origDescriptor = null;
    while (proto && !origDescriptor) {
      origDescriptor = Object.getOwnPropertyDescriptor(proto, "hass");
      proto = Object.getPrototypeOf(proto);
    }

    if (!origDescriptor || !origDescriptor.set) {
      setTimeout(() => patchHass(main), 100);
      return;
    }

    Object.defineProperty(main, "hass", {
      get() {
        return origDescriptor.get.call(this);
      },
      set(newHass) {
        try {
          cleanHassData(newHass);
        } catch (err) {
          console.error(`[${PLUGIN_NAME}] Error cleaning hass data:`, err);
        }
        origDescriptor.set.call(this, newHass);
      },
      configurable: true,
    });

    if (main.hass) {
      cleanHassData(main.hass);
      main.requestUpdate("hass");
    }

    syncSettings(main);
    main.__noDevicePrefixPatched = true;
    console.info(
      `[${PLUGIN_NAME}] Active (v2.1.0, mode=${optInMode ? "opt-in" : "opt-out"}).`
    );
  }

  function init() {
    const main = document.querySelector("home-assistant");
    if (main) {
      patchHass(main);
    } else {
      setTimeout(init, 100);
    }
  }

  init();
})();
