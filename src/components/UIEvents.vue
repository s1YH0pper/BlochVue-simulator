<template>
    <div class="event-menu" id="EventMenu" ref="eventMenuRef">
        <!-- Presets -->
        <ConfigSplitButton label="Presets"
            :options="['进动', '平衡态', '不均匀场', '混合物质', '弱梯度', '强梯度', '结构', '混沌态', '平面', 'Save']" @action="handleAction" />

        <!-- ExcHard -->
        <ConfigSplitButton label="ExcHard"
            :options="['90°ₓ 强脉冲', '90°ʸ 强脉冲', '80°ₓ 强脉冲', '30°ₓ 强脉冲', '30°ʸ 强脉冲', '90°ₓ 强sinc']"
            @action="handleAction" />

        <!-- Soft -->
        <ConfigSplitButton label="Soft"
            :options="['90°ₓ 弱脉冲', '90°ʸ 弱脉冲', '30°ₓ 弱脉冲', '30°ʸ 弱脉冲', '90°ₓ 弱sinc', '180°ʸ 弱sinc']"
            @action="handleAction" />

        <!-- Refocus -->
        <ConfigSplitButton label="Refocus" :options="['180°ʸ', '180°ₓ', '160°ʸ', '160°ₓ']" @action="handleAction" />

        <!-- Spoil -->
        <ConfigSplitButton label="Spoil" :options="['扰相', 'Gx 再聚焦', 'Gx 脉冲', 'Gy 脉冲']" @action="handleAction" />

        <!-- RepExc -->
        <ConfigSplitButton label="RepExc" :options="[
            '无重复激发',
            '[90°ₓ] TR=5s,扰相',
            '[30°ʸ] TR=3s,扰相',
            '[90°ʸ] TR=5s,扰相',
            '[90°ʸ] TR=8s,扰相',
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
import { ref, onMounted, onUnmounted } from "vue";
import ConfigSplitButton from "@/components/ConfigSplitButton.vue"; // 可复用子组件
import { useUIEvents } from "@/composables/useUIEvents";

// 暂停按钮状态
const pauseLabel = ref("||");
const eventMenuRef = ref(null)

const emit = defineEmits(["action"]);
const { buttonAction } = useUIEvents();

function togglePause() {
    handleAction(pauseLabel.value);
    pauseLabel.value = pauseLabel.value === "||" ? "▶" : "||";
    emit("action", pauseLabel.value);
}

// 所有下拉菜单和主按钮的动作
function handleAction(cmd) {
    buttonAction(cmd);
    emit("action", cmd);
}

// 自适应缩放：根据容器内容总宽与窗口宽度缩放
let resizeTimer = null
function adjustToScreen() {
    const el = eventMenuRef.value
    if (!el) return

    const scrWidth = window.innerWidth
    const totalWidth = Math.ceil(el.scrollWidth + 5)

    let zoomFactor
    if ((scrWidth < 800) || (totalWidth > scrWidth)) {
        zoomFactor = Math.max(0.5, scrWidth / totalWidth)
    } else {
        zoomFactor = 1
    }

    el.style.transform = `scale(${zoomFactor})`
}

function onResize() {
    if (resizeTimer) return
    resizeTimer = setTimeout(() => {
        resizeTimer = null
        adjustToScreen()
    }, 200)
}

onMounted(() => {
    adjustToScreen()
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', onResize)
})
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
    transform-origin: bottom left;
    padding-left: 8px;
}
</style>
