import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { setupErrorHandler, checkWebGLSupport, detectPerformance } from './utils/errorHandler'

// 检查WebGL支持
const webglCheck = checkWebGLSupport()
if (!webglCheck.supported) {
    ElMessageBox.alert(
        webglCheck.message + '，无法启动3D模拟器。请使用支持WebGL的现代浏览器。',
        'WebGL不支持',
        {
            type: 'error',
            confirmButtonText: '确定',
            callback: () => {
                document.body.innerHTML = '<div style="text-align:center;padding:50px;font-size:18px;">' +
                    '<h2>WebGL不支持</h2>' +
                    '<p>请使用Chrome、Firefox、Safari或Edge等现代浏览器访问。</p>' +
                    '</div>'
            }
        }
    )
} else {
    // 检测性能并给出建议
    const perfInfo = detectPerformance()
    console.log('设备性能检测:', perfInfo)

    if (perfInfo.performanceLevel === 'low') {
        setTimeout(() => {
            ElNotification({
                title: '性能提示',
                message: perfInfo.recommendation.message,
                type: 'warning',
                duration: 6000
            })
        }, 2000)
    }

    const app = createApp(App)

    // 设置全局错误处理
    setupErrorHandler(app)

    app.use(createPinia())
    app.use(ElementPlus)
    app.mount('#app')
}