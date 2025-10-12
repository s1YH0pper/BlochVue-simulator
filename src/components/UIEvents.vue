<template>
    <div class="event-menu" id="EventMenu" ref="eventMenuRef">
        <!-- Presets -->
        <ConfigSplitButton label="Presets" :options="['进动', '平衡态', '不均匀场', '混合物质', '弱梯度', '强梯度', '结构', '混沌态', '平面']"
            @action="toggleScene" />

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

        <!-- Save 普通按钮 -->
        <el-button type="warning" @click="toggleSave">
            {{ saveLabel }}
        </el-button>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessageBox } from 'element-plus';
import ConfigSplitButton from "@/components/ConfigSplitButton.vue"; // 可复用子组件
import { useUIEvents } from "@/composables/useUIEvents";

// 暂停按钮状态
const pauseLabel = ref("||");
const saveLabel = ref("保存场景");
const eventMenuRef = ref(null)

const emit = defineEmits(["action"]);
const { buttonAction } = useUIEvents();

function togglePause() {
    handleAction(pauseLabel.value);
    pauseLabel.value = pauseLabel.value === "||" ? "▶" : "||";
    emit("action", pauseLabel.value);
}

async function toggleSave() {
    if (saveLabel.value === "保存场景") {
        // 保存场景
        try {
            await ElMessageBox.confirm(
                '确定要保存当前场景状态吗？',
                '保存确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'info',
                    center: true
                }
            );
            handleAction(saveLabel.value);
            saveLabel.value = "恢复场景";
            emit("action", saveLabel.value);
        } catch {
            console.log('用户取消了保存操作');
        }
    } else {
        // 恢复场景
        try {
            await ElMessageBox.confirm(
                '确定要恢复到之前保存的场景状态吗？当前进度将会丢失。',
                '恢复确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                    center: true
                }
            );
            handleAction(saveLabel.value);
            emit("action", saveLabel.value);
        } catch {
            console.log('用户取消了恢复操作');
        }
    }
}

async function toggleScene(cmd) {
    try {
        await ElMessageBox.confirm(
            `确定要切换到场景"${cmd}"吗？当前场景的进度将会丢失。`,
            '场景切换确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                center: true
            }
        );
        // 用户确认后执行场景切换
        handleAction(cmd);
        saveLabel.value = "保存场景";
        pauseLabel.value = "||";
    } catch {
        // 用户取消，不执行任何操作
        console.log('用户取消了场景切换');
    }
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
    transform-origin: bottom left;
    padding-left: 8px;
}

.el-button+.el-button {
    margin-left: 0px;
}
</style>
