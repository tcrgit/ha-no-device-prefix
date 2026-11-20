"""No Device Prefix Frontend Integration."""
from pathlib import Path
import re

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv, label_registry as lr
from homeassistant.helpers.typing import ConfigType

DOMAIN = "no_device_prefix"
URL_BASE = "/no_device_prefix"
JS_FILENAME = "no-device-prefix.js"
CONF_OPT_IN_MODE = "opt_in_mode"
CONF_LABELS_SEEDED = "labels_seeded"

KEEP_SYNONYMS = {"keepprefix", "keepdeviceprefix"}
OMIT_SYNONYMS = {"omitprefix", "omitdeviceprefix", "noprefix", "nodeviceprefix"}

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)


def _normalize_label(value: str) -> str:
    """Normalize label names/IDs by stripping all separators."""
    return re.sub(r"[^a-z0-9]", "", value.lower())


def _async_seed_labels(hass: HomeAssistant) -> None:
    """Pre-create keep-prefix and omit-prefix labels if no equivalent exists."""
    registry = lr.async_get(hass)
    existing = set()
    for entry in registry.labels.values():
        existing.add(_normalize_label(entry.label_id))
        existing.add(_normalize_label(entry.name))

    if not (existing & KEEP_SYNONYMS):
        try:
            registry.async_create(
                "keep-prefix",
                icon="mdi:label-outline",
                description="Keep device name prefix on entities (No Device Prefix)",
            )
        except ValueError:
            pass

    if not (existing & OMIT_SYNONYMS):
        try:
            registry.async_create(
                "omit-prefix",
                icon="mdi:label-off-outline",
                description="Omit device name prefix on entities (No Device Prefix)",
            )
        except ValueError:
            pass


class NoDevicePrefixSettingsView(HomeAssistantView):
    """Serve current plugin options to the frontend."""

    url = f"{URL_BASE}/settings.json"
    name = "no_device_prefix:settings"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the settings view."""
        self.hass = hass

    async def get(self, request):
        """Return active options as JSON."""
        opt_in_mode = self.hass.data.get(f"{DOMAIN}_opt_in", False)
        return self.json({"opt_in_mode": opt_in_mode})


async def _register_frontend(hass: HomeAssistant) -> None:
    """Register the static path, settings endpoint, and JS module once."""
    if hass.data.get(DOMAIN):
        return

    js_path = Path(__file__).parent / JS_FILENAME

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                url_path=f"{URL_BASE}/{JS_FILENAME}",
                path=str(js_path),
                cache_headers=False,
            )
        ]
    )

    hass.http.register_view(NoDevicePrefixSettingsView(hass))
    add_extra_js_url(hass, f"{URL_BASE}/{JS_FILENAME}")
    hass.data[DOMAIN] = True


async def _async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Update cached options when changed in the UI."""
    hass.data[f"{DOMAIN}_opt_in"] = entry.options.get(CONF_OPT_IN_MODE, False)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up via configuration.yaml."""
    if DOMAIN in config:
        hass.data.setdefault(f"{DOMAIN}_opt_in", False)
        _async_seed_labels(hass)
        await _register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from a UI config entry."""
    hass.data[f"{DOMAIN}_opt_in"] = entry.options.get(CONF_OPT_IN_MODE, False)

    if not entry.data.get(CONF_LABELS_SEEDED):
        _async_seed_labels(hass)
        hass.config_entries.async_update_entry(
            entry, data={**entry.data, CONF_LABELS_SEEDED: True}
        )

    await _register_frontend(hass)
    entry.async_on_unload(entry.add_update_listener(_async_update_options))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return True

