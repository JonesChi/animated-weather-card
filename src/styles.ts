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
  }

  .pouring-rain {
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1));
  }


  .card-content {
    position: relative;
    z-index: 1;
    padding: 1.5rem;
  }

  clock-weather-card-header {
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

  .icon-badge {
    width: 64px;
    height: 64px;
    background: #a4b42b; /* Olive yellow from image */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }

  .header-info {
    display: flex;
    flex-direction: column;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .header-status {
    font-size: 1rem;
    opacity: 0.8;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }

  .grow-img {
    max-width: 100%;
    max-height: 100%;
  }

  clock-weather-card-forecast {
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
    opacity: 0.8;
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
