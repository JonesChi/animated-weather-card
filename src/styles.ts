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

  /* Sunny - Advanced Gold Glow & Lens Flare */
  .sunny {
    background: 
      radial-gradient(circle at 20% 20%, rgba(255, 255, 200, 0.2) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(255, 200, 100, 0.1) 0%, transparent 50%);
    animation: sunny-pulse 12s ease-in-out infinite alternate;
  }
  .sunny::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, transparent 30%, rgba(255, 255, 255, 0.05) 31%, transparent 32%);
    background-size: 100% 100%;
    animation: rotate-flare 30s linear infinite;
    mix-blend-mode: screen;
  }
  @keyframes sunny-pulse {
    from { opacity: 0.5; transform: scale(1); }
    to { opacity: 1; transform: scale(1.05); }
  }
  @keyframes rotate-flare {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Cloudy - Multi-layered Parallax Clouds */
  .cloudy {
    background: 
      radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
      radial-gradient(ellipse at 70% 60%, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  }
  .cloudy::before, .cloudy::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 400%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(255,255,255,0.05) 0%, transparent 10%),
      radial-gradient(circle at 15% 50%, rgba(255,255,255,0.03) 0%, transparent 15%),
      radial-gradient(circle at 25% 30%, rgba(255,255,255,0.04) 0%, transparent 12%),
      radial-gradient(circle at 40% 70%, rgba(255,255,255,0.05) 0%, transparent 10%),
      radial-gradient(circle at 55% 40%, rgba(255,255,255,0.03) 0%, transparent 15%),
      radial-gradient(circle at 70% 20%, rgba(255,255,255,0.04) 0%, transparent 12%),
      radial-gradient(circle at 85% 60%, rgba(255,255,255,0.05) 0%, transparent 10%);
    background-size: 25% 100%;
    animation: move-clouds 120s linear infinite;
    filter: blur(20px);
  }
  .cloudy::after {
    top: 10%;
    opacity: 0.6;
    animation-duration: 180s;
    animation-delay: -30s;
    filter: blur(30px);
  }
  @keyframes move-clouds {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  /* Rainy - Corrected V4 (Vertical Streaks) */
  .rainy {
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 100%);
  }
  .rainy::before, .rainy::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-repeat: repeat;
    animation: rain-fall-vertical 1s linear infinite;
  }
  /* Layer 1 - Mid Streaks */
  .rainy::before {
    background-image: 
      linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.4) 50%, transparent);
    background-size: 1px 120px;
    animation-duration: 0.8s;
    opacity: 0.4;
  }
  /* Layer 2 - Fast Streaks */
  .rainy::after {
    background-image: 
      linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.5) 50%, transparent);
    background-size: 2px 160px;
    animation-duration: 0.6s;
    animation-delay: -0.2s;
    opacity: 0.3;
  }

  /* Pouring - Corrected V4 (Dense & Fast) */
  .pouring {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%);
  }
  .pouring::before, .pouring::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 140%;
    height: 200%;
    background-repeat: repeat;
    transform: rotate(10deg);
    animation: rain-fall-vertical 0.4s linear infinite;
  }
  /* Layer 1 - Dense Sheets */
  .pouring::before {
    background-image: 
      linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.5) 40%, transparent);
    background-size: 1px 140px;
    opacity: 0.5;
  }
  /* Layer 2 - Driving Rain */
  .pouring::after {
    background-image: 
      linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.7) 40%, transparent);
    background-size: 2px 180px;
    opacity: 0.6;
    animation-duration: 0.3s;
    animation-delay: -0.1s;
  }

  @keyframes rain-fall-vertical {
    from { background-position: 0 0; }
    to { background-position: 0 400px; }
  }
  @keyframes rain-wash {
    0% { background-position: 0 0, 0 0, 0 0; }
    100% { background-position: 0 100%, -100% 0, 100% 0; }
  }

  @keyframes wind-sheets {
    0% { background-position: 0 0, 0 0; }
    50% { background-position: 0 0, -50px 0; }
    100% { background-position: 0 0, -100px 0; }
  }

  /* Lightning - Dramatic Non-linear Flashes */
  .lightning {
    background: rgba(10, 10, 30, 0.2);
    animation: lightning-cycle 8s infinite;
  }
  @keyframes lightning-cycle {
    0%, 90%, 100% { background: rgba(10, 10, 30, 0.2); }
    91% { background: rgba(255, 255, 255, 0.3); }
    92% { background: rgba(10, 10, 30, 0.2); }
    93% { background: rgba(255, 255, 255, 0.5); }
    94% { background: rgba(10, 10, 30, 0.2); }
  }

  /* Snowy - Realistic Drifting Snow */
  .snowy::before, .snowy::after {
    content: '';
    position: absolute;
    top: -10%;
    left: 0;
    width: 200%;
    height: 120%;
    background-image: 
      radial-gradient(circle, white 1px, transparent 1px),
      radial-gradient(circle, white 2px, transparent 2px);
    background-size: 100px 100px, 150px 150px;
    background-position: 0 0, 50px 50px;
    animation: snow-drift 15s linear infinite;
    filter: blur(1px);
    opacity: 0.8;
  }
  .snowy::after {
    animation-duration: 25s;
    animation-delay: -5s;
    background-size: 200px 200px, 250px 250px;
    filter: blur(2px);
    opacity: 0.5;
  }
  @keyframes snow-drift {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-5%, 25%); }
    50% { transform: translate(0, 50%); }
    75% { transform: translate(5%, 75%); }
    100% { transform: translate(0, 100px); }
  }

  /* Fog - Moving Fog Banks */
  .fog {
    background: linear-gradient(to bottom, transparent, rgba(200, 200, 200, 0.1), transparent);
  }
  .fog::before {
    content: '';
    position: absolute;
    width: 300%;
    height: 100%;
    background: 
      radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 25% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.15) 0%, transparent 45%),
      radial-gradient(ellipse at 75% 20%, rgba(255,255,255,0.1) 0%, transparent 55%),
      radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.15) 0%, transparent 40%);
    animation: move-fog 40s linear infinite;
    filter: blur(40px);
  }
  @keyframes move-fog {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
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
