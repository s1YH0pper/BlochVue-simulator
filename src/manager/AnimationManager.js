import { CONFIG } from "@/config";

class AnimationManager {
    constructor(renderCallback) {
        this.renderCallback = renderCallback; // 每帧调用的渲染函数
        this.then = null;
        this.lastTime = null;
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.lastTime = window.performance.now();
        this.then = this.lastTime;
        requestAnimationFrame(this.animate.bind(this));
    }

    stop() {
        this.isRunning = false;
    }

    animate(time) {
        if (!this.isRunning) return;
        let elapsed = time - this.then;
        if (elapsed < CONFIG.fpsInterval) {
            requestAnimationFrame(this.animate.bind(this));
            return;
        }
        this.then = time - (elapsed % CONFIG.fpsInterval);
        const dt = (time - this.lastTime) / 1000;
        this.renderCallback(dt);
        this.lastTime = time
        requestAnimationFrame(this.animate.bind(this));
    }
}

export { AnimationManager }; 