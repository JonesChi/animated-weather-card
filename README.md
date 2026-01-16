# Animated Weather Card

A [Home Assistant Dashboard Card](https://www.home-assistant.io/dashboards/) available through the [Home Assistant Community Store](https://hacs.xyz)
featuring beautiful animated weather backgrounds with current conditions and forecast display.

![Animated Weather Card](.github/assets/animations.gif)

This project is forked from [clock-weather-card](https://github.com/pkissling/clock-weather-card) with a focus on stunning animated weather visuals.

Credits go to [basmilius](https://github.com/basmilius) for the awesome [weather icons](https://github.com/basmilius/weather-icons).

## Features

- **Animated Weather Backgrounds**: Dynamic visual effects that match the current weather conditions. Supports 11 weather states:
  - ☀️ **Sunny**: Warm gradient with animated sunburst rays
  - � **Clear Night**: Serene night sky with stars
  - ☁️ **Cloudy**: Soft floating cloud animations
  - 🌤️ **Partly Cloudy**: Mixed sun and cloud effects
  - �🌧️ **Rainy**: Moody background with falling rain animation
  - 🌧️ **Pouring**: Heavy rain with intense precipitation effects
  - ⚡ **Lightning**: Dramatic lightning flash effects
  - ⛈️ **Lightning Rainy**: Combined storm with rain and lightning
  - ❄️ **Snowy**: Cold blue background with falling snowflakes
  - 🌨️ **Snowy Rainy**: Mixed snow and rain (sleet) effects
  - 🌫️ **Fog**: Atmospheric mist and haze effects
- **Current Weather Display**: Shows current temperature prominently with high/low range
- **Multi-day Forecast**: Visual forecast rows with weather icons and temperature ranges

## Card Layout

The card displays:

- **Title** (optional): Custom card title
- **Current Condition**: Weather state text (e.g., "Sunny", "Rainy")
- **Current Temperature**: Large temperature display with high/low for the day
- **Forecast Section**: Multi-day forecast with:
  - Day name
  - Weather icon for each day
  - High and low temperatures

## FAQ

### Why don't I see the current day in my weather forecast?

Your weather provider may not provide today's weather as part of their weather forecast. You may consider switching to a different weather provider.
[Open Meteo](https://www.home-assistant.io/integrations/open_meteo/) is the default weather integration in Home Assistant and provides today's weather.

## Installation

### Manual Installation

1. Download the [animated-weather-card.js](https://www.github.com/joneschi/animated-weather-card/releases/latest/download/animated-weather-card.js).
2. Place the file in your Home Assistant's `config/www` folder.
3. Add the configuration to your `ui-lovelace.yaml`.

   ```yaml
   resources:
     - url: /local/animated-weather-card.js
       type: module
   ```

4. Add [configuration](#configuration) for the card in your `ui-lovelace.yaml`.

### Installation and tracking with `hacs`

1. Make sure the [HACS](https://github.com/custom-components/hacs) component is installed and working.
2. Search for `animated-weather-card` in HACS and install it.
3. Depending on whether you manage your Lovelace resources via YAML (3i) or UI (3ii), you have to add the corresponding resources.
   1. **YAML:** Add the configuration to your `ui-lovelace.yaml`.

      ```yaml
      resources:
        - url: /hacsfiles/animated-weather-card/animated-weather-card.js
          type: module
      ```

   2. **UI:** Add Lovelace resource [![My Home Assistant](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources).
      _(Alternatively go to Settings -> Dashboards -> Resources -> Add Resource)_

      ```yaml
      URL: /hacsfiles/animated-weather-card/animated-weather-card.js
      Type: JavaScript Module
      ```

4. Restart Home Assistant.
5. Add [configuration](#configuration) for the card in your `ui-lovelace.yaml` or via the UI.

## Configuration

### Minimal configuration

```yaml
type: custom:animated-weather-card
entity: weather.home  # replace with your weather provider's entity id
```

### Full configuration

```yaml
type: custom:animated-weather-card
entity: weather.home  # replace with your weather provider's entity id
title: Home
sun_entity: sun.sun
temperature_sensor: sensor.outdoor_temp
forecast_rows: 5
locale: en-GB
hide_today_section: false
hide_forecast_section: false
hourly_forecast: false
show_decimal: false
```

### Options

| Name                  | Type         | Requirement  | Description                                                                                              | Default   |
| --------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------------------- | --------- |
| type                  | string       | **Required** | `custom:animated-weather-card`                                                                           |           |
| entity                | string       | **Required** | ID of the weather entity                                                                                 |           |
| title                 | string       | **Optional** | Title of the card                                                                                        | `''`      |
| sun_entity            | string       | **Optional** | ID of the sun entity. Used to determine whether to show day or night weather backgrounds                | `sun.sun` |
| temperature_sensor    | string       | **Optional** | ID of the temperature sensor entity. Used to show current temperature based on a sensor value           | `''`      |
| forecast_rows         | number       | **Optional** | Number of forecast rows to show. Each row corresponds to a day (or hour if `hourly_forecast` is enabled)| `5`       |
| locale                | string[^1]   | **Optional** | Language for localized text. Falls back to HA locale or `en-GB`                                          | `en-GB`   |
| hide_today_section    | boolean      | **Optional** | Hides the current weather section (upper section with temperature and condition)                         | `false`   |
| hide_forecast_section | boolean      | **Optional** | Hides the forecast section (lower section with multi-day forecast)                                       | `false`   |
| hourly_forecast       | boolean      | **Optional** | Displays hourly forecast instead of daily                                                                | `false`   |
| show_decimal          | boolean      | **Optional** | Displays temperature without rounding                                                                    | `false`   |

## Footnotes

[^1]: Supported languages: `ar`, `bg`, `ca`, `cs`, `cy`, `da`, `de`, `el`,`en`, `es`, `et`, `fi`, `fr`, `he`, `hu`, `hr`, `id`, `is`, `it`, `ko`, `lb`, `lt`, `nb`, `nl`, `pl`, `pt`, `pt-BR`, `ro`, `ru`, `sk`, `sl`, `sr`, `sr-Latn`, `sv`, `th`, `tr`, `uk`, `ur`, `vi`, `zh-CN`, `zh-TW`
