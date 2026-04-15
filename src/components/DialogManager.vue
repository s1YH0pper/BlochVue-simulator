<template>
    <div class="dialog-manager">
        <el-button class="help-btn" circle @click="openHelp" title="帮助 (H键)">
            <el-icon>
                <QuestionFilled />
            </el-icon>
        </el-button>
    </div>

    <HelpDialog v-model="showHelp" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import HelpDialog from '@/components/HelpDialog.vue'

const showHelp = ref(false)

function openHelp() {
    showHelp.value = true
}

function toggleHelp() {
    showHelp.value = !showHelp.value
}

onMounted(() => {
    // 首次访问时显示帮助
    showHelp.value = true
})

defineExpose({
    openHelp,
    toggleHelp
})
</script>

<style scoped>
.dialog-manager :deep(.el-button) {
    position: fixed;
    bottom: 10px;
    z-index: 999;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
}

.dialog-manager :deep(.el-button:hover) {
    transform: scale(1.1);
}

.help-btn {
    right: 10px;
}
</style>