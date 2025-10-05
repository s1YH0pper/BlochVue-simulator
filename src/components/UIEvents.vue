<template>
    <div class="event-menu">
        <!-- Presets -->
        <ConfigSplitButton label="Presets"
            :options="['Precession', '平衡态', 'Inhomogeneity', 'Mixed matter', '弱梯度', '强梯度', '结构', 'Ensemble', '平面', 'Save']"
            @action="handleAction" />

        <!-- ExcHard -->
        <ConfigSplitButton label="ExcHard"
            :options="['90°ₓ 硬脉冲', '90°ʸ 硬脉冲', '80°ₓ 硬脉冲', '30°ₓ 硬脉冲', '30°ʸ 硬脉冲', '90°ₓ sinch']"
            @action="handleAction" />

        <!-- Soft -->
        <ConfigSplitButton label="Soft"
            :options="['90°ₓ 软脉冲', '90°ʸ 软脉冲', '30°ₓ 软脉冲', '30°ʸ 软脉冲', '90°ₓ sincs', '180°ʸ sincs']"
            @action="handleAction" />

        <!-- Refocus -->
        <ConfigSplitButton label="Refocus" :options="['180°ʸ', '180°ₓ', '160°ʸ', '160°ₓ']" @action="handleAction" />

        <!-- Spoil -->
        <ConfigSplitButton label="Spoil" :options="['扰相', 'Gx refocus', 'Gx pulse', 'Gy pulse']"
            @action="handleAction" />

        <!-- RepExc -->
        <ConfigSplitButton label="RepExc" :options="[
            'Non-rep. exc.',
            '[90°ₓ] TR=5s,spoiled',
            '[30°ʸ] TR=3s,spoiled',
            '[90°ʸ] TR=5s,spoiled',
            '[90°ʸ] TR=8s,spoiled',
            '[90°ₓ] TR=5s',
            '[±90°ₓ] TR=5s',
            '90°ₓ-[180°ʸ]ES=5s'
        ]" @action="handleAction" />

        <!-- Pause 普通按钮 -->
        <el-button type="warning" @click="togglePause">
            {{ pauseLabel }}
        </el-button>
    </div>
</template>

<script setup>
import { ref } from "vue";
import ConfigSplitButton from "@/components/ConfigSplitButton.vue"; // 可复用子组件
import { useUIEvents } from "@/composables/useUIEvents";

// 暂停按钮状态
const pauseLabel = ref("||");

const emit = defineEmits(["action"]);
const { buttonAction } = useUIEvents();

function togglePause() {
    pauseLabel.value = pauseLabel.value === "||" ? "▶" : "||";
    emit("action", pauseLabel.value);
}

// 所有下拉菜单和主按钮的动作
function handleAction(cmd) {
    buttonAction(cmd);
    emit("action", cmd);
}
</script>

<style scoped>
.event-menu {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    position: absolute;
    bottom: 3%;
    z-index: 20;
}
</style>
