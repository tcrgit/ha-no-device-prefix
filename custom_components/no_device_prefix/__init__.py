"""No Device Prefix Frontend Integration."""
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

DOMAIN = "no_device_prefix"
URL_BASE = "/no_device_prefix"
JS_FILENAME = "no-device-prefix.js"

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)


async def _register_frontend(hass: HomeAssistant) -> None:
    """Register the static path and load the frontend JS module once."""
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

    add_extra_js_url(hass, f"{URL_BASE}/{JS_FILENAME}")
    hass.data[DOMAIN] = True


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up via configuration.yaml."""
    if DOMAIN in config:
        await _register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from a UI config entry."""
    await _register_frontend(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return True
