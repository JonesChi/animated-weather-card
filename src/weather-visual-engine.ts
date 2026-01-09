export type WeatherState =
    | 'sunny' | 'clear-night'
    | 'cloudy' | 'partlycloudy'
    | 'rainy'
    | 'pouring'
    | 'lightning' | 'lightning-rainy'
    | 'snowy' | 'snowy-rainy'
    | 'windy' | 'windy-variant'
    | 'fog' | 'hail'

interface Particle {
    x: number
    y: number
    l?: number // length for rain
    v: number // velocity y
    vx?: number // velocity x
    vy?: number // velocity y (for non-rain)
    a?: number // alpha/opacity
    sw?: number // sway offset for snow
    r?: number // radius
    rot?: number // rotation
    type: 'rain' | 'snow' | 'debris' | 'dust' | 'fog'
}

interface Cloud {
    x: number
    y: number
    r: number
    v: number
}

const rnd = (min: number, max: number) => Math.random() * (max - min) + min


export class WeatherVisualEngine {
    private canvasBg: HTMLCanvasElement
    private canvasScene: HTMLCanvasElement
    private canvasFx: HTMLCanvasElement
    private ctxBg: CanvasRenderingContext2D
    private ctxScene: CanvasRenderingContext2D
    private ctxFx: CanvasRenderingContext2D

    private w: number = 0
    private h: number = 0
    private particles: Particle[] = []
    private clouds: Cloud[] = []
    private rafId: number = 0

    // State
    private weather: WeatherState = 'sunny'
    private time: number = 0
    private lightning: number = 0

    constructor(bg: HTMLCanvasElement, scene: HTMLCanvasElement, fx: HTMLCanvasElement) {
        this.canvasBg = bg
        this.canvasScene = scene
        this.canvasFx = fx

        this.ctxBg = bg.getContext('2d', { alpha: false })! // Optimize bg
        this.ctxScene = scene.getContext('2d')!
        this.ctxFx = fx.getContext('2d')!
    }

    public start() {
        this.initClouds()
        this.loop()
    }

    public stop() {
        cancelAnimationFrame(this.rafId)
    }

    public resize(width: number, height: number) {
        this.w = width
        this.h = height
        const dpr = window.devicePixelRatio || 1

            ;[this.canvasBg, this.canvasScene, this.canvasFx].forEach((c, i) => {
                const ctx = [this.ctxBg, this.ctxScene, this.ctxFx][i]
                c.width = width * dpr
                c.height = height * dpr
                c.style.width = `${width}px`
                c.style.height = `${height}px`
                ctx.scale(dpr, dpr)
            })

        this.draw() // Force redraw
    }

    public setWeather(w: string) {
        // Map unknown strings to known types if necessary
        const mapped = w as WeatherState
        if (this.weather === mapped) return

        this.weather = mapped
        this.particles = []

        // Re-init particles based on weather
        if (['rainy', 'lightning-rainy'].includes(mapped)) {
            for (let i = 0; i < 100; i++) this.particles.push(this.createRainDrop(false))
        } else if (mapped === 'pouring') {
            for (let i = 0; i < 200; i++) this.particles.push(this.createRainDrop(true))
        } else if (mapped === 'snowy') {
            for (let i = 0; i < 80; i++) this.particles.push(this.createSnowFlake())
        } else if (mapped === 'snowy-rainy') {
            for (let i = 0; i < 70; i++) this.particles.push(this.createSnowFlake())
            for (let i = 0; i < 70; i++) this.particles.push(this.createRainDrop(false))
        } else if (['windy', 'windy-variant'].includes(mapped)) {
            for (let i = 0; i < 30; i++) this.particles.push(this.createDebris())
        } else if (['sunny', 'clear-night'].includes(mapped)) {
            for (let i = 0; i < 20; i++) this.particles.push(this.createDust())
        } else if (mapped === 'fog') {
            for (let i = 0; i < 50; i++) this.particles.push(this.createFogParticle())
        }
    }

    private initClouds() {
        // Initial random clouds
        for (let i = 0; i < 40; i++) {
            this.clouds.push({
                x: rnd(-100, 1200),
                y: rnd(-50, 300),
                r: rnd(20, 80),
                v: rnd(0.1, 0.4) // Slow drift
            })
        }
    }

    //Factories
    private createRainDrop(isPouring: boolean): Particle {
        return {
            x: rnd(0, this.w),
            y: rnd(0, this.h),
            l: rnd(10, 30),
            v: isPouring ? rnd(25, 40) : rnd(15, 25),
            a: rnd(0.2, 0.6),
            type: 'rain'
        }
    }
    private createSnowFlake(): Particle {
        return {
            x: rnd(0, this.w),
            y: rnd(0, this.h),
            r: rnd(1, 4),
            v: rnd(0.5, 2),
            sw: rnd(0, Math.PI * 2),
            type: 'snow'
        }
    }
    private createDebris(): Particle {
        return {
            x: rnd(0, this.w),
            y: rnd(this.h - 200, this.h),
            r: rnd(2, 5),
            vx: rnd(3, 8),
            vy: rnd(-1, 1),
            rot: rnd(0, 6),
            v: 0,
            type: 'debris'
        }
    }
    private createDust(): Particle {
        return {
            x: rnd(0, this.w),
            y: rnd(0, this.h),
            r: rnd(0.5, 2),
            vx: rnd(-0.5, 0.5),
            vy: rnd(-0.5, 0.5),
            a: rnd(0.3, 0.7),
            v: 0,
            type: 'dust'
        }
    }
    private createFogParticle(): Particle {
        return {
            x: rnd(0, this.w),
            y: rnd(0, this.h),
            r: rnd(50, 150),
            vx: rnd(0.1, 0.5),
            v: 0,
            a: rnd(0.01, 0.05),
            type: 'fog'
        }
    }

    private loop() {
        this.time += 0.016
        this.update()
        this.draw()

        // Lightning logic
        if (['lightning', 'lightning-rainy'].includes(this.weather)) {
            if (Math.random() > 0.99) this.lightning = 0.8
            this.lightning *= 0.9
        } else {
            this.lightning = 0
        }

        this.rafId = requestAnimationFrame(() => this.loop())
    }

    private update() {
        const w = this.weather
        const time = this.time

        // Update clouds
        this.clouds.forEach(c => {
            c.x += c.v // Move cloud
            if (c.x > this.w + c.r) {
                c.x = -c.r
                c.y = rnd(-50, this.h / 2) // Reset Y for variety
            }
        })

        this.particles.forEach(p => {
            if (p.type === 'rain') {
                p.y += p.v
                p.x -= this.weather === 'pouring' ? 2 : 1
                if (p.y > this.h) { p.y = -p.l!; p.x = rnd(0, this.w) }
            } else if (p.type === 'snow') {
                p.y += p.v
                p.x += Math.sin(time + (p.sw || 0)) * 0.5
                if (p.y > this.h) { p.y = -5; p.x = rnd(0, this.w) }
            } else if (p.type === 'debris') {
                p.x += (p.vx || 0) + (Math.sin(time * 2) * 2)
                p.y += (p.vy || 0)
                if (p.rot) p.rot += 0.1
                if (p.x > this.w) p.x = -10
            } else if (p.type === 'fog') {
                p.x += (p.vx || 0)
                if (p.x > this.w + p.r!) p.x = -p.r!
            } else {
                // sunny/floating/dust
                p.x += (p.vx || 0); p.y += (p.vy || 0)
                if (p.x < 0 || p.x > this.w) if (p.vx) p.vx *= -1
                if (p.y < 0 || p.y > this.h) if (p.vy) p.vy *= -1
            }
        })
    }

    private draw() {
        const { ctxBg, ctxScene, ctxFx } = this

        ctxScene.clearRect(0, 0, this.w, this.h)
        ctxFx.clearRect(0, 0, this.w, this.h)

        this.drawBackground(ctxBg)
        this.drawScene(ctxScene)

        // Lightning FX
        if (this.lightning > 0.01) {
            ctxFx.fillStyle = `rgba(255,255,255,${this.lightning})`
            ctxFx.fillRect(0, 0, this.w, this.h)
        }
    }

    private drawBackground(ctx: CanvasRenderingContext2D) {
        const w = this.weather
        const t = this.time

        let grad = ctx.createLinearGradient(0, 0, 0, this.h)

        // --- SUNNY / CLEAR ---
        if (['sunny', 'clear-night', 'partlycloudy'].includes(w)) {
            const isNight = w === 'clear-night'
            const sunX = this.w * 0.85
            const sunY = this.h * 0.15

            // Sky
            grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, this.w)
            if (isNight) {
                grad.addColorStop(0, '#2b32b2')
                grad.addColorStop(1, '#1488cc')
            } else {
                grad.addColorStop(0, '#ffd700')
                grad.addColorStop(0.2, '#ffaa00')
                grad.addColorStop(1, '#4da6ff')
            }
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)

            // Sun/Moon Rays
            if (!isNight) {
                ctx.save()
                ctx.translate(sunX, sunY)
                ctx.rotate(t * 0.05)
                ctx.fillStyle = 'rgba(255,255,200, 0.05)'
                for (let i = 0; i < 8; i++) {
                    ctx.rotate(Math.PI / 4)
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.w, -100); ctx.lineTo(this.w, 100); ctx.fill()
                }
                ctx.restore()
            }

            // Clouds for partly cloudy (White/Fluffy)
            if (w === 'partlycloudy') {
                this.drawSoftClouds(ctx, 'rgba(255, 255, 255, 0.4)')
            }

            // --- RAINY / DARK ---
        } else if (['rainy', 'pouring', 'lightning', 'lightning-rainy', 'hail'].includes(w)) {
            grad.addColorStop(0, '#1a1a2e')
            grad.addColorStop(1, '#16213e')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)

            // Heavy Dark Clouds
            this.drawSoftClouds(ctx, 'rgba(30, 30, 40, 0.6)')

            // --- SNOWY ---
        } else if (['snowy', 'snowy-rainy'].includes(w)) {
            grad.addColorStop(0, '#a8c0ff')
            grad.addColorStop(1, '#3f2b96')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)

            // --- CLOUDY / OVERCAST ---
        } else if (['cloudy'].includes(w)) {
            grad.addColorStop(0, '#757f9a')
            grad.addColorStop(1, '#d7dde8')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)

            // Greyish Clouds
            this.drawSoftClouds(ctx, 'rgba(240, 240, 255, 0.3)')

            // --- WINDY ---
        } else if (['windy', 'windy-variant'].includes(w)) {
            grad.addColorStop(0, '#485563')
            grad.addColorStop(1, '#29323c')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)
            this.drawSoftClouds(ctx, 'rgba(100, 100, 100, 0.4)')

            // --- FOG ---
        } else if (w === 'fog') {
            grad.addColorStop(0, '#8e9eab')
            grad.addColorStop(1, '#eef2f3')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, this.w, this.h)
        } else {
            // Default
            ctx.fillStyle = '#333'
            ctx.fillRect(0, 0, this.w, this.h)
        }
    }

    private drawSoftClouds(ctx: CanvasRenderingContext2D, colorStyle: string) {
        ctx.save()
        this.clouds.forEach(c => {
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
            grad.addColorStop(0, colorStyle) // Core color
            grad.addColorStop(1, 'rgba(255,255,255,0)') // Fade to transparent

            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.restore()
    }

    private drawScene(ctx: CanvasRenderingContext2D) {
        const w = this.weather
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'

        this.particles.forEach(p => {
            if (p.type === 'rain') {
                ctx.lineWidth = 1.5
                ctx.globalAlpha = p.a || 0.5
                ctx.beginPath()
                ctx.moveTo(p.x, p.y)
                const slant = w === 'pouring' ? -5 : -2
                ctx.lineTo(p.x + slant, p.y + (p.l || 10))
                ctx.stroke()
            } else if (p.type === 'snow') {
                ctx.globalAlpha = rnd(0.5, 0.9)
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r || 2, 0, Math.PI * 2); ctx.fill()
            } else if (p.type === 'debris') {
                ctx.save()
                ctx.translate(p.x, p.y); if (p.rot) ctx.rotate(p.rot)
                ctx.fillStyle = 'rgba(30,30,30,0.5)'
                ctx.fillRect(-(p.r || 2), -(p.r || 2) / 2, (p.r || 2) * 2, (p.r || 2))
                ctx.restore()
            } else if (p.type === 'fog') {
                ctx.fillStyle = 'rgba(255,255,255,0.1)'
                ctx.globalAlpha = p.a || 0.02
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r!, 0, Math.PI * 2)
                ctx.fill()
            } else {
                // Dust/Sunny
                ctx.globalAlpha = p.a || 0.5
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r || 1, 0, Math.PI * 2); ctx.fill()
            }
        })
        ctx.globalAlpha = 1
    }
}
