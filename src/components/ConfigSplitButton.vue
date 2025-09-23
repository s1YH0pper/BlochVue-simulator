<template>
    <el-dropdown @command="handleSubCommand">
        <el-button type="primary" split-button @click="handleMainClick">
            {{ currentLabel }}
        </el-button>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item v-for="opt in options" :key="opt" :command="opt">
                    {{ opt }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
    label: { type: String, required: true },
    options: { type: Array, default: () => [] }
});

const emit = defineEmits(["action"]);

const currentLabel = ref(props.label);

// 主按钮点击
function handleMainClick() {
    emit("action", currentLabel.value);
}

// 子选项点击
function handleSubCommand(cmd) {
    currentLabel.value = cmd; // 动态修改按钮文本
    emit("action", cmd);
}

// 如果父组件更新了 label，要同步更新
watch(
    () => props.label,
    (val) => (currentLabel.value = val)
);

onMounted(() => {
    currentLabel.value = props.options[0];
});
</script>
