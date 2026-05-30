import { ref, watch } from 'vue'

const STORAGE_KEY = 'blochvue-settings'

const defaultSettings = {
    // 显示选项
    showFPS: false,
    showHelpOnStart: true,

    // 性能选项
    performanceMode: 'auto',
    targetFPS: 60,
}

function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return { ...defaultSettings, ...parsed }
        }
    } catch (error) {
        console.error('加载设置失败:', error)
    }
    return { ...defaultSettings }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        return true
    } catch (error) {
        console.error('保存设置失败:', error)
        return false
    }
}

const settings = ref(loadSettings())

watch(settings, (newSettings) => {
    saveSettings(newSettings)
}, { deep: true })

/**
 * 用户设置管理（localStorage 持久化，模块级单例）
 */
export function useSettings() {
    function resetSettings() {
        settings.value = { ...defaultSettings }
        return true
    }

    return {
        settings,
        loadSettings,
        saveSettings,
        resetSettings,
        defaultSettings,
    }
}

/** 将目标 FPS 转为 AnimationManager 使用的帧间隔（毫秒） */
export function targetFpsToInterval(fps) {
    const clamped = Math.min(120, Math.max(30, Number(fps) || 60))
    return 1000 / clamped
}
