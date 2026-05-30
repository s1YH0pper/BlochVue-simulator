import { targetFpsToInterval } from '@/composables/useSettings'

class AnimationManager {
    constructor(renderCallback, targetFps = 60) {
        this.renderCallback = renderCallback
        this.fpsInterval = targetFpsToInterval(targetFps)
        this.then = null
        this.lastTime = null
        this.isRunning = false
        this._boundAnimate = this.animate.bind(this)
    }

    setTargetFps(fps) {
        this.fpsInterval = targetFpsToInterval(fps)
    }

    start() {
        this.isRunning = true
        this.lastTime = window.performance.now()
        this.then = this.lastTime
        requestAnimationFrame(this._boundAnimate)
    }

    stop() {
        this.isRunning = false
    }

    animate(time) {
        if (!this.isRunning) return

        const elapsed = time - this.then
        if (elapsed < this.fpsInterval) {
            requestAnimationFrame(this._boundAnimate)
            return
        }

        this.then = time - (elapsed % this.fpsInterval)
        const dt = (time - this.lastTime) / 1000
        this.renderCallback(dt)
        this.lastTime = time
        requestAnimationFrame(this._boundAnimate)
    }
}

export { AnimationManager }
