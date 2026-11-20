"""Config flow for No Device Prefix integration."""
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

DOMAIN = "no_device_prefix"
CONF_OPT_IN_MODE = "opt_in_mode"


class NoDevicePrefixConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for No Device Prefix."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(title="No Device Prefix", data={})

        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        """Return the options flow handler."""
        return NoDevicePrefixOptionsFlow()


class NoDevicePrefixOptionsFlow(config_entries.OptionsFlow):
    """Handle options flow for No Device Prefix."""

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_opt_in = self.config_entry.options.get(CONF_OPT_IN_MODE, False)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_OPT_IN_MODE, default=current_opt_in): bool,
                }
            ),
        )

