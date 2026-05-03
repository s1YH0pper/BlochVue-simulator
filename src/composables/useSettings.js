import { ref, watch } from 'vue'

/**
 * 用户设置管理（localStorage持久化）
 */
export function useSettings() {
    const STORAGE_KEY = 'blochvue-settings'

    // 默认设置
    const defaultSettings = {
        // 显示选项
        showFPS: false,
        showHelpOnStart: true,
    }

    // 从localStorage加载设置
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
        return defaultSettings
    }

    // 保存设置到localStorage
    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
            return true
        } catch (error) {
            console.error('保存设置失败:', error)
            return false
        }
    }

    // 创建响应式设置对象
    const settings = ref(loadSettings())

    // 监听设置变化，自动保存
    watch(settings, (newSettings) => {
        saveSettings(newSettings)
    }, { deep: true })

    // 重置为默认设置
    function resetSettings() {
        settings.value = { ...defaultSettings }
        return true
    }

    return {
        settings,
        loadSettings,
        saveSettings,
        resetSettings,
    }
}

