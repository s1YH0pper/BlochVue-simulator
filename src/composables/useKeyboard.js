import { onUnmounted } from 'vue'
import { useAppStateStore, useStateStore } from '@/stores/state'

/**
 * 键盘快捷键管理系统
 */
export function useKeyboard(options = {}) {
    const appState = useAppStateStore()

    const { } = options

    const handleKeydown = (event) => {
        const { key, target } = event

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

        // F键：全屏切换
        if (key === 'f' || key === 'F') {
            event.preventDefault()
            toggleFullscreen()
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
