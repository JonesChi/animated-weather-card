import { LitElement, html, type TemplateResult, type PropertyValues, type CSSResultGroup } from 'lit'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators.js'
import {
  type HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  type ActionHandlerEvent,
  handleAction,
  type ActionConfig
} from 'custom-card-helpers' // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import {
  type AnimatedWeatherCardConfig,
  type MergedAnimatedWeatherCardConfig,
  type MergedWeatherForecast,
  type TemperatureSensor,
  type TemperatureUnit,
  type HumiditySensor,
  type Weather,
  WeatherEntityFeature,
  type WeatherForecast,
  type WeatherForecastEvent
} from './types'
import { WeatherVisualEngine } from './weather-visual-engine'
import styles from './styles'
import { actionHandler } from './action-handler-directive'
import { localize } from './localize/localize'
import { type HassEntity, type HassEntityBase } from 'home-assistant-js-websocket'
import { extractMostOccuring, max, min, roundIfNotNull, roundUp } from './utils'
import { animatedIcons, staticIcons } from './images'
import { version } from '../package.json'
import { safeRender } from './helpers'

console.info(
  `%c  ANIMATED-WEATHER-CARD \n%c Version: ${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'animated-weather-card',
  name: 'Animated Weather Card',
  description: 'Shows the current weather and forcast with fancy weather condition animations.'
})

@customElement('animated-weather-card')
export class AnimatedWeatherCard extends LitElement {
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant

  @state() private config!: MergedAnimatedWeatherCardConfig
  @state() private forecasts?: WeatherForecast[]
  @state() private error?: TemplateResult
  private forecastSubscriber?: () => Promise<void>
  private forecastSubscriberLock = false
  private visualEngine?: WeatherVisualEngine
  private resizeObserver?: ResizeObserver
  private _lastWeatherState?: string

  public static getStubConfig (_hass: HomeAssistant, entities: string[], entitiesFallback: string[]): Record<string, unknown> {
    const entity = entities.find(e => e.startsWith('weather.') ?? entitiesFallback.find(() => true))
    if (entity) {
      return { entity }
    }

    return {}
  }

  public getCardSize (): number {
    return 3 + roundUp(this.config.forecast_rows / 2)
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig (config?: AnimatedWeatherCardConfig): void {
    if (!config) {
      throw this.createError('Invalid configuration.')
    }

    if (!config.entity) {
      throw this.createError('Attribute "entity" must be present.')
    }

    if (config.forecast_rows && config.forecast_rows < 1) {
      throw this.createError('Attribute "forecast_rows" must be greater than 0.')
    }

    if (config.hide_today_section && config.hide_forecast_section) {
      throw this.createError('Attributes "hide_today_section" and "hide_forecast_section" must not enabled at the same time.')
    }

    this.config = this.mergeConfig(config)
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate (changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false
    }

    if (changedProps.has('forecasts')) {
      return true
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined
    if (oldHass) {
      const oldSun = oldHass.states[this.config.sun_entity]
      const newSun = this.hass.states[this.config.sun_entity]

      const newWeatherState = this.hass.states[this.config.entity]?.state
      if (newWeatherState !== this._lastWeatherState) {
        return true
      }

      if (oldSun !== newSun) {
        return true
      }
    }

    return hasConfigOrEntityChanged(this, changedProps, false)
  }

  protected updated (changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('config')) {
      void this.subscribeForecastEvents()
    }

    if (changedProps.has('hass') || changedProps.has('config')) {
      this.updateWeatherVisuals()
    }
  }

  protected firstUpdated (): void {
    this.initVisualEngine()
  }

  private initVisualEngine (): void {
    const container = this.shadowRoot?.getElementById('weather-container')
    const bg = this.shadowRoot?.getElementById('bg-canvas') as HTMLCanvasElement
    const scene = this.shadowRoot?.getElementById('scene-canvas') as HTMLCanvasElement
    const fx = this.shadowRoot?.getElementById('fx-canvas') as HTMLCanvasElement

    if (bg && scene && fx && container) {
      this.visualEngine = new WeatherVisualEngine(bg, scene, fx)
      this.visualEngine.start()

      this.resizeObserver = new ResizeObserver(() => {
        if (this.visualEngine) {
          const rect = container.getBoundingClientRect()
          this.visualEngine.resize(rect.width, rect.height)
        }
      })
      this.resizeObserver.observe(container)

      // Initial resize
      const rect = container.getBoundingClientRect()
      this.visualEngine.resize(rect.width, rect.height)

      // Set initial weather
      this.updateWeatherVisuals()
    }
  }

  private updateWeatherVisuals (): void {
    if (!this.visualEngine || !this.hass || !this.config) return
    try {
      const weather = this.getWeather()
      this.visualEngine.setWeather(weather.state)
      this._lastWeatherState = weather.state
    } catch (e) {
      // Weather entity might not be ready
    }
  }

  // https://lit.dev/docs/components/rendering/
  protected render (): TemplateResult {
    if (this.error) {
      return this.error
    }

    const showToday = !this.config.hide_today_section
    const showForecast = !this.config.hide_forecast_section

    // Note: We use the canvas engine now, but keep the weather-animation container for positioning
    return html`
      <ha-card
        @action=${(e: ActionHandlerEvent) => { this.handleAction(e) }}
        .actionHandler=${actionHandler({
      hasHold: hasAction(this.config.hold_action as ActionConfig | undefined),
      hasDoubleClick: hasAction(this.config.double_tap_action as ActionConfig | undefined)
    })}
        tabindex="0"
        .label=${`Animated Weather Card: ${this.config.entity || 'No Entity Defined'}`}
      >
        <div class="weather-animation" id="weather-container">
            <canvas id="bg-canvas"></canvas>
            <canvas id="scene-canvas"></canvas>
            <canvas id="fx-canvas"></canvas>
        </div>
        
        <div class="card-content">
          ${showToday ? safeRender(() => this.renderToday()) : ''}
          ${showForecast
        ? html`
            <animated-weather-card-forecast class="${showToday ? 'with-separator' : ''}">
              ${safeRender(() => this.renderForecast())}
            </animated-weather-card-forecast>`
        : ''}
        </div>
      </ha-card>
    `
  }

  public connectedCallback (): void {
    super.connectedCallback()
    if (this.hasUpdated) {
      void this.subscribeForecastEvents()

      // Restart the visual engine if it was stopped
      if (this.visualEngine) {
        this.visualEngine.start()
      }

      // Re-observe resize if it was disconnected
      const container = this.shadowRoot?.getElementById('weather-container')
      if (this.resizeObserver && container) {
        this.resizeObserver.observe(container)
      }
    }
  }

  public disconnectedCallback (): void {
    super.disconnectedCallback()
    void this.unsubscribeForecastEvents()
    if (this.visualEngine) this.visualEngine.stop()
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  protected willUpdate (changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (!this.forecastSubscriber) {
      void this.subscribeForecastEvents()
    }
  }

  private renderToday (): TemplateResult {
    const weather = this.getWeather()
    const state = weather.state
    const temp = this.config.show_decimal ? this.getCurrentTemperature() : roundIfNotNull(this.getCurrentTemperature())
    const tempUnit = weather.attributes.temperature_unit
    const weatherString = this.localize(`weather.${state}`)
    const localizedTemp = temp !== null ? this.toConfiguredTempWithUnit(tempUnit, temp) : null

    // Get today's forecast to find High/Low
    const dailyForecasts = this.mergeForecasts(1, false) // 1 day, daily mode
    const today = dailyForecasts.length > 0 ? dailyForecasts[0] : null
    const highTemp = today ? (this.config.show_decimal ? today.temperature : Math.round(today.temperature)) : null
    const lowTemp = today ? (this.config.show_decimal ? today.templow : Math.round(today.templow)) : null
    const localizedHigh = highTemp !== null ? this.toConfiguredTempWithoutUnit(tempUnit, highTemp) : null
    const localizedLow = lowTemp !== null ? this.toConfiguredTempWithoutUnit(tempUnit, lowTemp) : null

    return html`
      <animated-weather-card-header>
        <div class="header-left">
          <div class="header-info">
            <div class="header-title">${this.config.title ?? 'Météo'}</div>
            <div class="header-status">${weatherString}</div>
          </div>
        </div>
        <div class="header-right">
          <div class="weather-stat">
            <ha-icon icon="mdi:thermometer" class="stat-icon"></ha-icon>
            <div class="stat-value current">${localizedTemp}</div>
          </div>
          ${today
        ? html`
            <div class="weather-stat high-low">
              <span class="high">${localizedHigh}°</span>
              <span class="separator">/</span>
              <span class="low">${localizedLow}°</span>
            </div>
          `
        : ''}
        </div>
      </animated-weather-card-header>
    `
  }

  private renderForecast (): TemplateResult[] {
    const weather = this.getWeather()
    const currentTemp = this.config.show_decimal ? this.getCurrentTemperature() : roundIfNotNull(this.getCurrentTemperature())
    const maxRowsCount = this.config.forecast_rows
    const hourly = this.config.hourly_forecast
    const temperatureUnit = weather.attributes.temperature_unit

    const forecasts = this.mergeForecasts(maxRowsCount, hourly)

    const minTemps = forecasts.map((f) => f.templow)
    const maxTemps = forecasts.map((f) => f.temperature)
    if (currentTemp !== null) {
      minTemps.push(currentTemp)
      maxTemps.push(currentTemp)
    }
    const minTemp = Math.round(min(minTemps))
    const maxTemp = Math.round(max(maxTemps))

    const displayTexts = forecasts
      .map(f => f.datetime)
      .map(d => {
        if (hourly) {
          return d.toLocaleTimeString(this.getLocale(), { hour: 'numeric', minute: 'numeric' })
        }
        const dayIndex = d.getDay() || 7
        return this.localize(`day.${dayIndex}`)
      })
    const maxColOneChars = displayTexts.length ? max(displayTexts.map(t => t.length)) : 0

    return forecasts.map((forecast, i) => safeRender(() => this.renderForecastItem(forecast, minTemp, maxTemp, currentTemp, temperatureUnit, hourly, displayTexts[i], maxColOneChars)))
  }

  private renderForecastItem (forecast: MergedWeatherForecast, _minTemp: number, _maxTemp: number, currentTemp: number | null, _temperatureUnit: TemperatureUnit, hourly: boolean, displayText: string, _maxColOneChars: number): TemplateResult {
    const weatherState = forecast.condition === 'pouring' ? 'raindrops' : forecast.condition === 'rainy' ? 'raindrop' : forecast.condition
    const weatherIcon = this.toIcon(weatherState, 'fill', true, 'static')
    const tempUnit = this.getWeather().attributes.temperature_unit
    const now = new Date()
    const isNow = hourly ? now.getHours() === forecast.datetime.getHours() : now.getDate() === forecast.datetime.getDate()
    const minTempDayRaw = isNow && currentTemp !== null ? Math.min(currentTemp, forecast.templow) : forecast.templow
    const maxTempDayRaw = isNow && currentTemp !== null ? Math.max(currentTemp, forecast.temperature) : forecast.temperature
    const minTempDay = this.config.show_decimal ? minTempDayRaw : Math.round(minTempDayRaw)
    const maxTempDay = this.config.show_decimal ? maxTempDayRaw : Math.round(maxTempDayRaw)

    return html`
      <div class="forecast-item">
        <div class="forecast-day">${displayText}</div>
        <div class="forecast-icon">
          <img class="grow-img" src=${weatherIcon} />
        </div>
        <div class="forecast-temps">
          <div class="temp-high">${this.toConfiguredTempWithUnit(tempUnit, maxTempDay)}</div>
          <div class="temp-low">${this.toConfiguredTempWithUnit(tempUnit, minTempDay)}</div>
        </div>
      </div>
    `
  }

  // https://lit.dev/docs/components/styles/
  static get styles (): CSSResultGroup {
    return styles
  }

  private handleAction (ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action)
    }
  }

  private mergeConfig (config: AnimatedWeatherCardConfig): MergedAnimatedWeatherCardConfig {
    return {
      ...config,
      sun_entity: config.sun_entity ?? 'sun.sun',
      temperature_sensor: config.temperature_sensor,
      forecast_rows: config.forecast_rows ?? 5,
      hourly_forecast: config.hourly_forecast ?? false,
      hide_forecast_section: config.hide_forecast_section ?? false,
      hide_today_section: config.hide_today_section ?? false,
      show_decimal: config.show_decimal ?? false
    }
  }

  private toIcon (weatherState: string, type: 'fill' | 'line', forceDay: boolean, kind: 'static' | 'animated'): string {
    const daytime = forceDay ? 'day' : this.getSun()?.state === 'below_horizon' ? 'night' : 'day'
    const iconMap = kind === 'animated' ? animatedIcons : staticIcons
    const icon = iconMap[type][weatherState]
    return icon?.[daytime] || icon
  }

  private getWeather (): Weather {
    const weather = this.hass.states[this.config.entity] as Weather | undefined
    if (!weather) {
      throw this.createError(`Weather entity "${this.config.entity}" could not be found.`)
    }
    return weather
  }

  private getCurrentTemperature (): number | null {
    if (this.config.temperature_sensor) {
      const temperatureSensor = this.hass.states[this.config.temperature_sensor] as TemperatureSensor | undefined
      const temp = temperatureSensor?.state ? parseFloat(temperatureSensor.state) : undefined
      const unit = temperatureSensor?.attributes.unit_of_measurement ?? this.getConfiguredTemperatureUnit()
      if (temp !== undefined && !isNaN(temp)) {
        return this.toConfiguredTempWithoutUnit(unit, temp)
      }
    }

    // return weather temperature if above code could not extract temperature from temperature_sensor
    return this.getWeather().attributes.temperature ?? null
  }

  private getCurrentHumidity (): number | null {
    if (this.config.humidity_sensor) {
      const humiditySensor = this.hass.states[this.config.humidity_sensor] as HumiditySensor | undefined
      const humid = humiditySensor?.state ? parseFloat(humiditySensor.state) : undefined
      if (humid !== undefined && !isNaN(humid)) {
        return humid
      }
    }

    // Return weather humidity if the code could not extract humidity from the humidity_sensor
    return this.getWeather().attributes.humidity ?? null
  }

  private getApparentTemperature (): number | null {
    if (this.config.apparent_sensor) {
      const apparentSensor = this.hass.states[this.config.apparent_sensor] as TemperatureSensor | undefined
      const temp = apparentSensor?.state ? parseFloat(apparentSensor.state) : undefined
      const unit = apparentSensor?.attributes.unit_of_measurement ?? this.getConfiguredTemperatureUnit()
      if (temp !== undefined && !isNaN(temp)) {
        return this.toConfiguredTempWithoutUnit(unit, temp)
      }
    }
    return null
  }

  private getAqi (): number | null {
    if (this.config.aqi_sensor) {
      const aqiSensor = this.hass.states[this.config.aqi_sensor] as HassEntity | undefined
      const aqi = aqiSensor?.state ? parseInt(aqiSensor.state) : undefined
      if (aqi !== undefined && !isNaN(aqi)) {
        return aqi
      }
    }
    return null
  }

  private getAqiBackgroundColor (aqi: number | null): string | null {
    if (aqi == null) {
      return null
    }
    if (aqi <= 50) return '#00FF00'
    if (aqi <= 100) return '#FFFF00'
    if (aqi <= 150) return '#FF8C00'
    if (aqi <= 200) return '#FF0000'
    if (aqi <= 300) return '#9400D3'
    return '#8B0000'
  }

  private getAqiTextColor (aqi: number | null): string {
    // Use black text for light backgrounds (green, yellow, orange) for better readability.
    if (aqi !== null && aqi <= 150) {
      return '#000000'
    }
    // Use white text for dark backgrounds (red, purple, maroon).
    return '#FFFFFF'
  }

  private getSun (): HassEntityBase | undefined {
    return this.hass.states[this.config.sun_entity]
  }

  private getLocale (): string {
    return this.config.locale ?? this.hass.locale.language ?? 'en-GB'
  }

  private toCelsius (temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°C' ? temperature : Math.round((temperature - 32) * (5 / 9))
  }

  private toFahrenheit (temperatueUnit: TemperatureUnit, temperature: number): number {
    return temperatueUnit === '°F' ? temperature : Math.round((temperature * 9 / 5) + 32)
  }

  private getConfiguredTemperatureUnit (): TemperatureUnit {
    return this.hass.config.unit_system.temperature as TemperatureUnit
  }

  private toConfiguredTempWithUnit (unit: TemperatureUnit, temp: number): string {
    const convertedTemp = this.toConfiguredTempWithoutUnit(unit, temp)
    return convertedTemp + this.getConfiguredTemperatureUnit()
  }

  private toConfiguredTempWithoutUnit (unit: TemperatureUnit, temp: number): number {
    const configuredUnit = this.getConfiguredTemperatureUnit()
    if (configuredUnit === unit) {
      return temp
    }

    return unit === '°C'
      ? this.toFahrenheit(unit, temp)
      : this.toCelsius(unit, temp)
  }

  private localize (key: string): string {
    return localize(key, this.getLocale())
  }

  private mergeForecasts (maxRowsCount: number, hourly: boolean): MergedWeatherForecast[] {
    const forecasts = this.isLegacyWeather() ? this.getWeather().attributes.forecast ?? [] : this.forecasts ?? []
    const agg = forecasts.reduce<Record<number, WeatherForecast[]>>((forecasts, forecast) => {
      const d = new Date(forecast.datetime)
      const unit = hourly ? `${d.getMonth()}-${d.getDate()}-${+d.getHours()}` : d.getDate()
      forecasts[unit] = forecasts[unit] || []
      forecasts[unit].push(forecast)
      return forecasts
    }, {})

    return Object.values(agg)
      .reduce((agg: MergedWeatherForecast[], forecasts) => {
        if (forecasts.length === 0) return agg
        const avg = this.calculateAverageForecast(forecasts)
        agg.push(avg)
        return agg
      }, [])
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
      .slice(0, maxRowsCount)
  }

  private calculateAverageForecast (forecasts: WeatherForecast[]): MergedWeatherForecast {
    const minTemps = forecasts.map((f) => f.templow ?? f.temperature ?? this.getCurrentTemperature() ?? 0)
    const minTemp = min(minTemps)

    const maxTemps = forecasts.map((f) => f.temperature ?? this.getCurrentTemperature() ?? 0)
    const maxTemp = max(maxTemps)

    const precipitationProbabilities = forecasts.map((f) => f.precipitation_probability ?? 0)
    const precipitationProbability = max(precipitationProbabilities)

    const precipitations = forecasts.map((f) => f.precipitation ?? 0)
    const precipitation = max(precipitations)

    const conditions = forecasts.map((f) => f.condition)
    const condition = extractMostOccuring(conditions)

    return {
      temperature: maxTemp,
      templow: minTemp,
      datetime: this.parseDateTime(forecasts[0].datetime),
      condition,
      precipitation_probability: precipitationProbability,
      precipitation
    }
  }

  private async subscribeForecastEvents (): Promise<void> {
    if (this.forecastSubscriberLock) {
      return
    }
    this.forecastSubscriberLock = true
    await this.unsubscribeForecastEvents()
    if (this.isLegacyWeather()) {
      this.forecastSubscriber = async () => { }
      this.forecastSubscriberLock = false
      return
    }

    if (!this.isConnected || !this.config || !this.hass) {
      this.forecastSubscriberLock = false
      return
    }

    const forecastType = this.determineForecastType()
    if (forecastType === 'hourly_not_supported') {
      this.forecastSubscriber = async () => { }
      this.forecastSubscriberLock = false
      throw this.createError(`Weather entity [${this.config.entity}] does not support hourly forecast.`)
    }
    try {
      const callback = (event: WeatherForecastEvent): void => {
        this.forecasts = event.forecast
      }
      const options = { resubscribe: false }
      const message = {
        type: 'weather/subscribe_forecast',
        forecast_type: forecastType,
        entity_id: this.config.entity
      }
      this.forecastSubscriber = await this.hass.connection.subscribeMessage<WeatherForecastEvent>(callback, message, options)
    } catch (e: unknown) {
      console.error('animated-weather-card - Error when subscribing to weather forecast', e)
    } finally {
      this.forecastSubscriberLock = false
    }
  }

  private async unsubscribeForecastEvents (): Promise<void> {
    if (this.forecastSubscriber) {
      try {
        await this.forecastSubscriber()
      } catch (e: unknown) {
        // swallow error, as this means that connection was closed already
      } finally {
        this.forecastSubscriber = undefined
      }
    }
  }

  private isLegacyWeather (): boolean {
    return !this.supportsFeature(WeatherEntityFeature.FORECAST_DAILY) && !this.supportsFeature(WeatherEntityFeature.FORECAST_HOURLY)
  }

  private supportsFeature (feature: WeatherEntityFeature): boolean {
    try {
      return (this.getWeather().attributes.supported_features & feature) !== 0
    } catch (e) {
      // might be that weather entity was not found
      return false
    }
  }

  private createError (errorString: string): Error {
    const error = new Error(errorString)
    const errorCard = document.createElement('hui-error-card')
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config
    })
    this.error = html`${errorCard}`
    return error
  }

  private determineForecastType (): 'hourly' | 'daily' | 'hourly_not_supported' {
    const supportsDaily = this.supportsFeature(WeatherEntityFeature.FORECAST_DAILY)
    const supportsHourly = this.supportsFeature(WeatherEntityFeature.FORECAST_HOURLY)
    const hourly = this.config.hourly_forecast
    if (supportsDaily && supportsHourly) {
      return hourly ? 'hourly' : 'daily'
    } else if (hourly && supportsHourly) {
      return 'hourly'
    } else if (!hourly && supportsDaily) {
      return 'daily'
    } else if (hourly && !supportsHourly) {
      return 'hourly_not_supported'
    } else {
      // !hourly && !supportsDaily
      console.warn(`animated-weather-card - Weather entity [${this.config.entity}] does not support daily forecast. Falling back to hourly forecast.`)
      return 'hourly'
    }
  }

  private parseDateTime (date: string): Date {
    return new Date(date)
  }
}
