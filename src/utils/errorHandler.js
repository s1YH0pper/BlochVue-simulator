import { ElMessage, ElNotification } from 'element-plus'

/**
 * 全局错误处理器
 */
export function setupErrorHandler(app) {
    // Vue全局错误处理
    app.config.errorHandler = (err, instance, info) => {
        console.error('Vue错误:', err)
        console.error('错误信息:', info)
        console.error('组件实例:', instance)

        // 用户友好的错误提示
        ElMessage.error({
            message: '发生了一个错误，系统已自动恢复',
            duration: 3000,
            showClose: true
        })

        // 可选：上报错误到监控系统
        // reportError(err, info)
    }

    // 捕获Promise未处理的rejection
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise拒绝:', event.reason)

        ElNotification({
            title: '异步操作失败',
            message: '某个后台操作未能完成，请检查网络连接',
            type: 'warning',
            duration: 4000
        })

        event.preventDefault()
    })

    // 捕获全局JS错误
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error)

        // 避免重复提示
        if (!event.error?.handled) {
            ElMessage.error({
                message: '页面遇到错误，请刷新重试',
                duration: 3000
            })

            if (event.error) {
                event.error.handled = true
            }
        }
    })
}

/**
 * WebGL上下文丢失处理
 */
export function setupWebGLErrorHandler(canvas, onRestore) {
    canvas.addEventListener('webglcontextlost', (event) => {
        console.warn('WebGL上下文丢失')
        event.preventDefault()

        ElNotification({
            title: 'WebGL上下文丢失',
            message: '3D渲染暂时中断，正在尝试恢复...',
            type: 'warning',
            duration: 0 // 持续显示直到恢复
        })
    })

    canvas.addEventListener('webglcontextrestored', () => {
        console.log('WebGL上下文已恢复')

        ElNotification.closeAll()
        ElMessage.success({
            message: 'WebGL已恢复，可以继续使用',
            duration: 3000
        })

        if (onRestore) {
            onRestore()
        }
    })
}

/**
 * 检测WebGL支持
 */
export function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

        if (!gl) {
            return {
                supported: false,
                message: '您的浏览器不支持WebGL'
            }
        }

        return { supported: true }
    } catch (e) {
        return {
            supported: false,
            message: 'WebGL检测失败: ' + e.message
        }
    }
}

/**
 * 性能检测 - 检测设备性能并给出建议
 */
export function detectPerformance() {
    const nav = navigator
    const ua = nav.userAgent.toLowerCase()

    // 检测移动设备
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua)

    // 检测GPU信息（如果可用）
    let gpuTier = 'unknown'
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                // 简单的GPU分级
                if (/nvidia|geforce|radeon|amd/i.test(renderer)) {
                    gpuTier = 'high'
                } else if (/intel/i.test(renderer)) {
                    gpuTier = 'medium'
                } else {
                    gpuTier = 'low'
                }
            }
        }
    } catch (e) {
        console.warn('无法检测GPU信息')
    }

    // 检测内存
    const memory = nav.deviceMemory || 4 // 默认4GB

    // 检测CPU核心数
    const cores = nav.hardwareConcurrency || 4

    // 综合评分
    let performanceLevel = 'medium'
    if (isMobile) {
        performanceLevel = memory >= 6 && cores >= 6 ? 'medium' : 'low'
    } else {
        if (memory >= 8 && cores >= 8 && gpuTier === 'high') {
            performanceLevel = 'high'
        } else if (memory >= 4 && cores >= 4) {
            performanceLevel = 'medium'
        } else {
            performanceLevel = 'low'
        }
    }

    return {
        isMobile,
        gpuTier,
        memory,
        cores,
        performanceLevel,
        recommendation: getPerformanceRecommendation(performanceLevel)
    }
}

function getPerformanceRecommendation(level) {
    const recommendations = {
        high: {
            message: '您的设备性能优秀，可以流畅运行所有场景',
            settings: { quality: 'high', maxIsochromats: 1000 }
        },
        medium: {
            message: '建议使用中等质量设置以获得最佳体验',
            settings: { quality: 'medium', maxIsochromats: 500 }
        },
        low: {
            message: '检测到设备性能较低，建议使用低质量设置或简单场景',
            settings: { quality: 'low', maxIsochromats: 200 }
        }
    }

    return recommendations[level] || recommendations.medium
}

