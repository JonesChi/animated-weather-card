import { css } from 'lit'

export default css`

  ha-card {
    --bar-height: 1.5rem;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    overflow: hidden;
    position: relative;
  }

  /* Weather Animations */
  .weather-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    transition: opacity 1s ease-in-out;
    overflow: hidden;
  }

  /* Canvas Layers */
  #bg-canvas, #scene-canvas, #fx-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  #bg-canvas {
    z-index: 0;
    transition: filter 1s ease;
  }
  #scene-canvas {
    z-index: 1;
    mix-blend-mode: plus-lighter;
  }
  #fx-canvas {
    z-index: 2;
    pointer-events: none;
    opacity: 0.7;
    mix-blend-mode: overlay;
  }



  .card-content {
    position: relative;
    z-index: 1;
    padding: 1.5rem;
  }

  animated-weather-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-info {
    display: flex;
    flex-direction: column;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: bold;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .header-status {
    font-size: 1rem;
    opacity: 0.9;
    font-weight: 500;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
  }

  .weather-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-value.current {
    font-size: 2rem;
    font-weight: bold;
    line-height: 1;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .stat-icon {
    width: 24px;
    height: 24px;
  }

  .weather-stat.high-low {
    font-size: 0.9rem;
    gap: 0.3rem;
    opacity: 0.9;
    font-weight: 500;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .separator {
    opacity: 0.5;
  }

  .high {
    font-weight: 600;
  }

  .low {
    opacity: 0.7;
  }

  .grow-img {
    max-width: 100%;
    max-height: 100%;
  }

  animated-weather-card-forecast {
    display: flex;
    justify-content: space-around;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .forecast-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .forecast-day {
    font-size: 0.9rem;
    opacity: 0.9;
    font-weight: 500;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .forecast-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .forecast-temps {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1rem;
    gap: 0.2rem;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  }

  .temp-high {
    font-weight: bold;
  }

  .temp-low {
    opacity: 0.7;
    font-size: 0.9rem;
  }

  aqi {
    padding: 2px 6px;
    border-radius: 5px;
    font-size: 0.8rem;
  }
`
