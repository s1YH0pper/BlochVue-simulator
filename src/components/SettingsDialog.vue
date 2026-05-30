<template>
    <el-dialog v-model="visible" title="设置" :width="dialogWidth" class="settings-dialog" append-to-body>
        <el-form :model="localSettings" :label-width="formLabelWidth" :label-position="formLabelPosition"
            class="settings-form">
            <!-- 显示选项 -->
            <el-divider content-position="left">显示选项</el-divider>

            <el-form-item label="启动时显示帮助" class="settings-row">
                <el-switch v-model="localSettings.showHelpOnStart" />
            </el-form-item>

            <el-form-item label="启动时显示性能监控" class="settings-row">
                <el-switch v-model="localSettings.showFPS" @change="handleFPSChange" />
            </el-form-item>

            <!-- 性能选项 -->
            <el-divider content-position="left">性能选项</el-divider>

            <el-form-item label="性能模式" class="settings-field-block">
                <el-select v-model="localSettings.performanceMode" placeholder="选择性能模式" class="settings-control">
                    <el-option label="自动检测" value="auto" />
                    <el-option label="高性能" value="high" />
                    <el-option label="中等性能" value="medium" />
                    <el-option label="低性能" value="low" />
                </el-select>
            </el-form-item>

            <el-form-item label="目标帧率" class="settings-field-block settings-slider-row">
                <el-slider v-model="localSettings.targetFPS" :min="30" :max="120" :step="10" show-stops
                    :marks="{ 30: '30', 60: '60', 120: '120' }" class="settings-slider" />
            </el-form-item>

            <!-- 数据管理 -->
            <el-divider content-position="left">数据管理</el-divider>

            <el-form-item class="settings-data-block">
                <div class="data-actions">
                    <el-button size="small" type="danger" @click="handleResetSettings">恢复默认</el-button>
                    <el-button size="small" type="warning" @click="handleClearCache">清除缓存</el-button>
                </div>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="settings-footer-actions">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="handleSave">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettings } from '@/composables/useSettings'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'fpsChange'])

const visible = ref(props.modelValue)
const { settings, resetSettings } = useSettings()
const localSettings = ref({ ...settings.value })

// 响应式对话框宽度
const windowWidth = ref(window.innerWidth)

const dialogWidth = computed(() => {
    if (windowWidth.value < 768) {
        return 'min(92vw, 420px)'
    }
    if (windowWidth.value < 1024) {
        return 'min(80vw, 520px)'
    }
    return '560px'
})

const isCompactForm = computed(() => windowWidth.value < 768)

const formLabelPosition = computed(() => (isCompactForm.value ? 'top' : 'left'))

const formLabelWidth = computed(() => (isCompactForm.value ? undefined : '140px'))

// 监听窗口大小变化
const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

// 同步v-model
watch(() => props.modelValue, (newVal) => {
    visible.value = newVal
    if (newVal) {
        // 打开对话框时，重新加载当前设置
        localSettings.value = { ...settings.value }
    }
})

watch(visible, (newVal) => {
    emit('update:modelValue', newVal)
})

// 保存设置
function handleSave() {
    Object.assign(settings.value, localSettings.value)
    ElMessage.success('设置已保存')
    visible.value = false
}

// FPS显示切换
function handleFPSChange(value) {
    emit('fpsChange', value)
}

// 恢复默认设置
async function handleResetSettings() {
    try {
        await ElMessageBox.confirm(
            '确定要恢复所有设置为默认值吗？',
            '恢复默认设置',
            {
                type: 'warning',
                confirmButtonText: '确定',
                cancelButtonText: '取消'
            }
        )
        resetSettings()
        localSettings.value = { ...settings.value }
        ElMessage.success('已恢复默认设置')
    } catch {
        // 用户取消
    }
}

// 清除缓存
async function handleClearCache() {
    try {
        await ElMessageBox.confirm(
            '这将清除所有保存的场景、设置和缓存数据。确定要继续吗？',
            '清除缓存',
            {
                type: 'warning',
                confirmButtonText: '确定',
                cancelButtonText: '取消'
            }
        )

        // 清除localStorage
        const keysToKeep = ['blochvue-settings']
        const allKeys = Object.keys(localStorage)
        allKeys.forEach(key => {
            if (key.startsWith('blochvue-') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key)
            }
        })

        ElMessage.success({
            message: '缓存已清除，建议刷新页面',
            duration: 3000
        })
    } catch {
        // 用户取消
    }
}
</script>

<style scoped>
.settings-dialog :deep(.el-dialog) {
    max-height: 88vh;
    margin-top: 6vh;
    border-radius: 12px;
    background: rgba(22, 23, 26, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
}

.settings-dialog :deep(.el-dialog__header) {
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.settings-dialog :deep(.el-dialog__title) {
    font-weight: 650;
    font-size: 16px;
}

.settings-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: rgba(255, 255, 255, 0.65);
}

.settings-dialog :deep(.el-dialog__body) {
    padding: 12px 20px 8px;
    overflow-y: auto;
    max-height: calc(88vh - 132px);
}

.settings-dialog :deep(.el-dialog__footer) {
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.settings-form :deep(.el-form-item) {
    margin-bottom: 16px;
}

.settings-form :deep(.el-form-item__label) {
    font-weight: 500;
}

.settings-form :deep(.el-form-item__content) {
    justify-content: flex-start;
}

.settings-row :deep(.el-form-item__content) {
    justify-content: flex-start;
}

.settings-slider {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 6px 0;
}

.settings-slider-row :deep(.el-form-item__content) {
    display: block;
}

.settings-dialog :deep(.el-divider) {
    margin: 18px 0 14px;
    border-color: rgba(255, 255, 255, 0.1);
}

.settings-dialog :deep(.el-divider__text) {
    background: rgba(22, 23, 26, 0.98);
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.data-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.settings-data-block {
    margin-bottom: 12px;
}

.settings-footer-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
}
</style>
