import { onUnmounted } from 'vue'
import { useAppStateStore, useStateStore } from '@/stores/state'

/**
 * 键盘快捷键管理系统
 * @param {Object} options - 配置选项
 * @param {Function} options.onToggleHelp - 切换帮助面板回调
 * @param {Function} options.onSaveScene - 保存场景回调
 * @param {Function} options.onRestoreScene - 恢复场景回调
 */
export function useKeyboard(options = {}) {
    const appState = useAppStateStore()
    const state = useStateStore()

    const { onToggleHelp, onSaveScene, onRestoreScene } = options

    // 数字键到场景的映射（1-9）
    const sceneKeyMap = {
        '1': 'Precession',      // 进动
        '2': 'Equilibrium',      // 平衡态
        '3': 'Inhomogeneity',    // 不均匀场
        '4': 'Mixed matter',      // 混合物质
        '5': 'Weak gradient',     // 弱梯度
        '6': 'Strong gradient',   // 强梯度
        '7': 'Structure',         // 结构
        '8': 'Ensemble',          // 混沌态
        '9': 'Plane',             // 平面
    }

    const handleKeydown = (event) => {
        const { key, target } = event
        const keyLower = key.toLowerCase()
        const isCtrl = event.ctrlKey || event.metaKey

        // 忽略在输入框中的按键
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return
        }

        // 空格键：暂停/恢复
        if (key === ' ') {
            event.preventDefault()
            appState.togglePause()
            return
        }

        // H键：显示/隐藏帮助
        if (keyLower === 'h') {
            event.preventDefault()
            if (onToggleHelp) onToggleHelp()
            return
        }

        // F键：全屏切换
        if (keyLower === 'f') {
            event.preventDefault()
            toggleFullscreen()
            return
        }

        // Ctrl+S：保存场景
        if (isCtrl && keyLower === 's') {
            event.preventDefault()
            if (onSaveScene) onSaveScene()
            return
        }

        // Ctrl+R：恢复场景
        if (isCtrl && keyLower === 'r') {
            event.preventDefault()
            if (onRestoreScene && appState.savedFlag) onRestoreScene()
            return
        }

        // 数字键（1-9）：切换场景
        if (key >= '1' && key <= '9') {
            event.preventDefault()
            const sceneName = sceneKeyMap[key]
            if (sceneName) {
                state.Sample = sceneName
                appState.trigSampleChange = true
            }
            return
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('无法进入全屏模式:', err)
            })
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
    }

    // 生命周期管理 - 立即执行，不依赖onMounted
    // 因为这个composable可能在onMounted中被调用
    window.addEventListener('keydown', handleKeydown)

    // 但清理仍然使用onUnmounted
    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown)
    })

    return {
        toggleFullscreen,
    }
}
