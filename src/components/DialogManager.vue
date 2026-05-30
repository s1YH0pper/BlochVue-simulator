<template>
    <div class="dialog-manager">
        <el-button class="perf-toggle-btn" circle @click="togglePerf" title="性能监控">
            <el-icon>
                <Histogram />
            </el-icon>
        </el-button>

        <el-button class="help-btn" circle @click="openHelp" title="帮助 (H键)">
            <el-icon>
                <QuestionFilled />
            </el-icon>
        </el-button>

        <el-button class="settings-btn" circle @click="showSettings = true" title="设置">
            <el-icon>
                <Setting />
            </el-icon>
        </el-button>
    </div>

    <HelpDialog v-model="showHelp" />

    <PerformanceMonitor :visible="showPerf" />

    <SettingsDialog v-model="showSettings" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Histogram, QuestionFilled, Setting } from '@element-plus/icons-vue'
import HelpDialog from '@/components/HelpDialog.vue'
import PerformanceMonitor from '@/components/PerformanceMonitor.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { useSettings } from '@/composables/useSettings'

const showHelp = ref(false)
const showPerf = ref(false)
const showSettings = ref(false)

const { settings } = useSettings()

function openHelp() {
    showHelp.value = true
}

function toggleHelp() {
    showHelp.value = !showHelp.value
}

function togglePerf() {
    showPerf.value = !showPerf.value
    settings.value.showFPS = showPerf.value
}

onMounted(() => {
    showPerf.value = settings.value.showFPS
    if (settings.value.showHelpOnStart && !localStorage.getItem('blochvue-hide-help')) {
        setTimeout(() => {
            showHelp.value = true
        }, 1000)
    }
})

defineExpose({
    openHelp,
    toggleHelp
})
</script>

<style scoped>
.dialog-manager :deep(.el-button) {
    position: fixed;
    bottom: 22px;
    z-index: 999;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
}

.dialog-manager :deep(.el-button:hover) {
    transform: scale(1.1);
}

.perf-toggle-btn {
    right: 132px;
}

.help-btn {
    right: 78px;
}

.settings-btn {
    right: 24px;
}
</style>