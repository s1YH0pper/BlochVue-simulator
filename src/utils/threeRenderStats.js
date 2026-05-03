/**
 * 统计 WebGLRenderer.render() 调用次数，供 PerformanceMonitor 按间隔汇总为场景 FPS。
 * 仅在 SceneManager.render 中打点，避免与浏览器 rAF 总数混淆。
 */

let renderCount = 0
let lastSampleTime = performance.now()

export function recordThreeSceneRender() {
    renderCount++
}

/**
 * 取出自上次 consume 以来的渲染次数与时间间隔，并清零计数。
 */
export function consumeThreeRenderStats() {
    const now = performance.now()
    const dtMs = now - lastSampleTime
    const renders = renderCount
    renderCount = 0
    lastSampleTime = now
    return { renders, dtMs }
}

export function resetThreeRenderStats() {
    renderCount = 0
    lastSampleTime = performance.now()
}
