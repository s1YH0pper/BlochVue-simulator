<template>
    <transition name="fade">
        <div v-if="visible" class="perf-monitor" :class="{ warning: fps < 30, critical: fps < 20 }">
            <div class="perf-header" @click="toggleExpanded" role="button" tabindex="0">
                <div class="perf-title">
                    <span class="perf-dot" />
                    <span>Performance</span>
                </div>
                <el-icon class="perf-chevron">
                    <ArrowUp v-if="expanded" />
                    <ArrowDown v-else />
                </el-icon>
            </div>

            <div class="perf-grid">
                <div class="perf-metric">
                    <div class="perf-label">场景 FPS</div>
                    <div class="perf-value" :class="fpsClass">{{ fps }}</div>
                </div>

                <div class="perf-metric">
                    <div class="perf-label">渲染帧时</div>
                    <div class="perf-value" :class="fpsClass">{{ frameTime }}<span class="perf-unit">ms</span></div>
                </div>

                <div class="perf-metric" v-if="memorySupported">
                    <div class="perf-label">内存</div>
                    <div class="perf-value perf-value-dim">{{ memory }}<span class="perf-unit">MB</span></div>
                </div>
            </div>

            <!-- 扩展信息 -->
            <transition name="expand">
                <div v-if="expanded" class="perf-details">
                    <div class="perf-detail-item">
                        <span>平均场景 FPS:</span>
                        <span>{{ avgFps }}</span>
                    </div>
                    <div class="perf-detail-item">
                        <span>最小场景 FPS:</span>
                        <span>{{ minFps }}</span>
                    </div>
                    <div class="perf-detail-item">
                        <span>最大场景 FPS:</span>
                        <span>{{ maxFps }}</span>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { consumeThreeRenderStats, resetThreeRenderStats } from '@/utils/threeRenderStats'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

// 性能数据
const fps = ref(60)
const avgFps = ref(60)
const minFps = ref(60)
const maxFps = ref(60)
const frameTime = ref(0)
const memory = ref(0)
const memorySupported = ref(false)
const expanded = ref(false)

const fpsClass = ref('good')

// 性能统计（按秒聚合的「场景渲染」FPS，来自 WebGLRenderer.render 调用次数）
let lastStatTime = performance.now()
let fpsHistory = []
const historySize = 60 // 保留60秒历史

let animationId = null

const startMonitoring = () => {
    if (animationId !== null) {
        return
    }
    resetThreeRenderStats()
    lastStatTime = performance.now()

    const updateStats = () => {
        const currentTime = performance.now()
        const deltaTime = currentTime - lastStatTime

        if (deltaTime >= 1000) {
            const { renders, dtMs } = consumeThreeRenderStats()
            if (dtMs > 0) {
                const currentFps = renders > 0
                    ? Math.round((renders * 1000) / dtMs)
                    : 0
                fps.value = currentFps
                frameTime.value = renders > 0
                    ? Math.round((dtMs / renders) * 10) / 10
                    : 0
                fpsClass.value = currentFps < 20 ? 'critical' : currentFps < 30 ? 'warning' : 'good'

                fpsHistory.push(currentFps)
                if (fpsHistory.length > historySize) {
                    fpsHistory.shift()
                }

                if (fpsHistory.length > 0) {
                    avgFps.value = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
                    minFps.value = Math.min(...fpsHistory)
                    maxFps.value = Math.max(...fpsHistory)
                }
            }

            if (memorySupported.value) {
                const usedMemory = performance.memory.usedJSHeapSize / 1048576
                memory.value = Math.round(usedMemory * 10) / 10
            }

            lastStatTime = currentTime
        }

        animationId = requestAnimationFrame(updateStats)
    }

    animationId = requestAnimationFrame(updateStats)
}

const stopMonitoring = () => {
    if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
    }
    resetThreeRenderStats()
}

const toggleExpanded = () => {
    expanded.value = !expanded.value
}

// 暴露重置方法
const reset = () => {
    fpsHistory = []
    resetThreeRenderStats()
    lastStatTime = performance.now()
}

defineExpose({
    reset
})

// 检测浏览器是否支持内存API
onMounted(() => {
    memorySupported.value = typeof performance !== 'undefined'
        && 'memory' in performance
        && performance.memory != null
        && 'usedJSHeapSize' in performance.memory
})

onUnmounted(() => {
    stopMonitoring()
})

watch(
    () => props.visible,
    (v) => {
        if (v) {
            startMonitoring()
        } else {
            stopMonitoring()
        }
    },
    { immediate: true }
)
</script>

<style scoped>
.perf-monitor {
    position: fixed;
    top: 260px;
    /* FID图表下方（FID top: 1% + height: 245px ≈ 260px）*/
    right: 10px;
    /* 右侧对齐FID图表 */
    width: 176px;
    background: rgba(17, 18, 20, 0.78);
    color: rgba(255, 255, 255, 0.92);
    padding: 10px;
    border-radius: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    z-index: 9999;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    user-select: none;
}

.perf-monitor.warning {
    border-color: rgba(255, 193, 7, 0.35);
}

.perf-monitor.critical {
    border-color: rgba(244, 67, 54, 0.35);
}

.perf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.perf-header:hover {
    background: rgba(255, 255, 255, 0.06);
}

.perf-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 650;
    letter-spacing: 0.2px;
}

.perf-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(76, 175, 80, 0.95);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.16);
}

.perf-monitor.warning .perf-dot {
    background: rgba(255, 193, 7, 0.95);
    box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.18);
}

.perf-monitor.critical .perf-dot {
    background: rgba(244, 67, 54, 0.95);
    box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.18);
}

.perf-chevron {
    opacity: 0.9;
}

.perf-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.perf-metric {
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.perf-label {
    font-size: 11px;
    opacity: 0.72;
    margin-bottom: 4px;
}

.perf-value {
    font-size: 16px;
    font-weight: 750;
    line-height: 1.1;
    letter-spacing: 0.2px;
}

.perf-value.good {
    color: rgba(76, 175, 80, 0.98);
}

.perf-value.warning {
    color: rgba(255, 193, 7, 0.98);
}

.perf-value.critical {
    color: rgba(244, 67, 54, 0.98);
}

.perf-value-dim {
    color: rgba(255, 255, 255, 0.9);
}

.perf-unit {
    font-size: 11px;
    font-weight: 650;
    opacity: 0.75;
    margin-left: 3px;
}

.perf-details {
    margin-top: 10px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.perf-detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    line-height: 1.3;
    font-size: 11px;
    opacity: 0.92;
}

.perf-detail-item:last-child {
    margin-bottom: 0;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease;
    max-height: 200px;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>
