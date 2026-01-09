import { html, type TemplateResult } from 'lit'

export function safeRender<T> (renderFn: () => T): T | TemplateResult {
  try {
    return renderFn()
  } catch (e) {
    console.error('animated-weather-card - Error while rendering animated-weather-card component:', e)
    return html``
  }
}
