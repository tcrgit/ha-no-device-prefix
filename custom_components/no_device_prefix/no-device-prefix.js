/**
 * Home Assistant Frontend Plugin: No Device Prefix (v2.0 - Universal)
 * Restores pre-2026.11 entity naming behavior by preventing redundant
 * device name concatenation on device entities while preserving
 * standalone device names.
 */
(function () {
  const PLUGIN_NAME = "No Device Prefix";

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

      const deviceNames = [device.name_by_user, device.name].filter(Boolean);
      if (deviceNames.length === 0) continue;

      const stateObj = states[entityId];
      const rawFriendly = stateObj?.attributes?.friendly_name || "";
      const rawMetaName = entityMeta.name || entityMeta.original_name;

      // If the entity has no sub-name of its own (e.g., a single-switch device where
      // the entity name is null), keep the device name so it doesn't render blank.
      if (!rawMetaName && deviceNames.includes(rawFriendly)) {
        continue;
      }

      // 1. Strip literal device prefix if baked into friendly_name or entity name
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

      // 2. Disable 2026.11's automatic device prefix concatenation (next_name_part)
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

    main.__noDevicePrefixPatched = true;
    console.info(`[${PLUGIN_NAME}] Universal interceptor active (v2.0).`);
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
