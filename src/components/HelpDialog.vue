<template>
    <el-dialog v-model="visible" title="操作指南与快捷键" :width="dialogWidth" center :close-on-click-modal="true"
        :close-on-press-escape="true" class="help-dialog">
        <el-tabs v-model="activeTab">
            <!-- 快捷键标签页 -->
            <el-tab-pane label="快捷键" name="shortcuts">
                <div class="help-section">
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="空格键">
                            <el-tag type="info">暂停/恢复动画</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="H">
                            <el-tag type="info">显示/隐藏此帮助面板</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="F">
                            <el-tag type="info">进入/退出全屏模式</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="Ctrl + S">
                            <el-tag type="success">保存场景快照</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="Ctrl + R">
                            <el-tag type="warning">恢复到已保存的场景快照</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="数字键 1-9">
                            <el-tag type="primary">快速切换场景</el-tag>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </el-tab-pane>
            <el-tab-pane label="场景快捷键映射" name="scenesShortcuts">
                <div class="help-section">
                    <el-row :gutter="10">
                        <el-col :span="8" v-for="(scene, key) in sceneMapping" :key="key">
                            <el-card shadow="hover" class="scene-card">
                                <template #header>
                                    <span class="key-badge">{{ key }}</span>
                                </template>
                                <div class="scene-name">{{ scene }}</div>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>
            </el-tab-pane>
            <!-- 操作指南标签页 -->
            <el-tab-pane label="操作指南" name="guide">
                <div class="help-section">
                    <h4>🎯 基本操作</h4>
                    <el-steps direction="vertical">
                        <el-step title="选择场景" status="process">
                            <template #description>
                                点击"Presets"下拉菜单选择不同的预设场景，如进动、平衡态、不均匀场等。
                            </template>
                        </el-step>
                        <el-step title="应用脉冲" status="finish">
                            <template #description>
                                使用"ExcHard"（强脉冲）、"Soft"（弱脉冲）、"Refocus"（重聚焦）按钮对自旋施加射频脉冲。
                            </template>
                        </el-step>
                        <el-step title="观察变化" status="success">
                            <template #description>
                                在3D场景中观察磁化矢量的运动，右上角FID图表显示信号随时间的变化。
                            </template>
                        </el-step>
                        <el-step title="调整参数" status="finish">
                            <template #description>
                                使用右侧dat.GUI面板调整B0、B1、T1、T2等物理参数，实时观察效果。
                            </template>
                        </el-step>
                    </el-steps>
                </div>

                <div class="help-section">
                    <h4>🔬 高级功能</h4>
                    <ul class="feature-list">
                        <li><strong>场景保存与恢复：</strong>可以保存当前状态快照，稍后恢复到该状态。</li>
                        <li><strong>重复激发：</strong>使用"RepExc"菜单配置重复脉冲序列（TR、扰相等）。</li>
                        <li><strong>梯度脉冲：</strong>在固定参考系场景中可使用Gx/Gy梯度脉冲。</li>
                        <li><strong>扰相：</strong>快速破坏横向磁化，模拟梯度扰相效果。</li>
                    </ul>
                </div>
            </el-tab-pane>

            <!-- 场景说明标签页 -->
            <el-tab-pane label="场景说明" name="scenes">
                <div class="help-section">
                    <el-collapse accordion>
                        <el-collapse-item title="进动 (Precession)" name="1">
                            <p>单个等向体在静磁场中的自由进动，展示最基本的拉莫尔进动现象。</p>
                        </el-collapse-item>
                        <el-collapse-item title="平衡态 (Equilibrium)" name="2">
                            <p>磁化矢量处于热平衡状态，所有横向分量为零，仅有纵向磁化。</p>
                        </el-collapse-item>
                        <el-collapse-item title="不均匀场 (Inhomogeneity)" name="3">
                            <p>9个等向体在不同频率下进动，模拟磁场不均匀性导致的去相位效应。</p>
                        </el-collapse-item>
                        <el-collapse-item title="混合物质 (Mixed Matter)" name="4">
                            <p>三种不同T1/T2弛豫时间的物质，展示组织对比原理。</p>
                        </el-collapse-item>
                        <el-collapse-item title="弱梯度/强梯度" name="5">
                            <p>线性排列的等向体，在梯度场中产生空间编码，用于理解频率编码。</p>
                        </el-collapse-item>
                        <el-collapse-item title="结构 (Structure)" name="6">
                            <p>结构化排列的等向体，展示特定空间分布的信号特征。</p>
                        </el-collapse-item>
                        <el-collapse-item title="混沌态 (Ensemble)" name="7">
                            <p>热力学系综，大量随机取向的自旋，模拟真实样品的统计行为。</p>
                        </el-collapse-item>
                        <el-collapse-item title="平面 (Plane)" name="8">
                            <p>二维平面分布的等向体，用于理解相位编码和二维成像原理。</p>
                        </el-collapse-item>
                    </el-collapse>
                </div>
            </el-tab-pane>

            <!-- 关于标签页 -->
            <el-tab-pane label="关于" name="about">
                <div class="help-section about-section">
                    <h3>BlochVue Simulator</h3>
                    <p class="version">版本: 0.1.1</p>
                    <p>Vue 3 版本的 Bloch Simulator，用于 MRI / NMR 磁共振的可视化模拟。</p>

                    <el-divider />

                    <h4>技术栈</h4>
                    <el-tag v-for="tech in techStack" :key="tech" style="margin: 4px;">{{ tech }}</el-tag>

                    <el-divider />

                    <h4>浏览器兼容性</h4>
                    <ul class="browser-list">
                        <li>Chrome 90+</li>
                        <li>Firefox 88+</li>
                        <li>Safari 14+</li>
                        <li>Edge 90+</li>
                    </ul>

                    <el-divider />

                    <p class="github-link">
                        <el-link href="https://github.com/s1YH0pper/BlochVue-simulator" target="_blank" type="primary">
                            GitHub 仓库
                        </el-link>
                    </p>

                    <p class="license">License: GPLv3</p>
                </div>
            </el-tab-pane>
        </el-tabs>

        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleClose">知道了</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const activeTab = ref('shortcuts')

// 响应式对话框宽度
const windowWidth = ref(window.innerWidth)

const dialogWidth = computed(() => {
    if (windowWidth.value < 768) {
        return '90%'  // 移动端90%
    } else if (windowWidth.value < 1024) {
        return '85%'  // 平板85%
    } else {
        return '680px'  // 桌面端固定680px
    }
})

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

// 场景映射
const sceneMapping = {
    '1': '进动',
    '2': '平衡态',
    '3': '不均匀场',
    '4': '混合物质',
    '5': '弱梯度',
    '6': '强梯度',
    '7': '结构',
    '8': '混沌态',
    '9': '平面',
}

// 技术栈
const techStack = [
    'Vue 3.5.18',
    'Three.js 0.180.0',
    'Element Plus 2.11.2',
    'Pinia 3.0.3',
    'Vite 7.0.6',
    'dat.GUI 0.7.9'
]

// 同步 v-model
watch(() => props.modelValue, (newVal) => {
    visible.value = newVal
})

watch(visible, (newVal) => {
    emit('update:modelValue', newVal)
})

// 关闭处理
const handleClose = () => {
    visible.value = false
}
</script>

<style scoped>
.help-section {
    margin-bottom: 24px;
}

.help-section h4 {
    margin-bottom: 12px;
    color: #409eff;
    font-size: 16px;
}

.scene-card {
    margin-bottom: 10px;
    text-align: center;
}

.key-badge {
    font-size: 18px;
    font-weight: bold;
    color: #409eff;
}

.scene-name {
    font-size: 14px;
    color: #606266;
}

.feature-list {
    line-height: 1.8;
    padding-left: 20px;
}

.feature-list li {
    margin-bottom: 8px;
}

.about-section {
    text-align: center;
}

.about-section .version {
    color: #909399;
    font-size: 14px;
    margin-bottom: 16px;
}

.browser-list {
    list-style: none;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
}

.browser-list li {
    padding: 8px 16px;
    background: #f4f4f5;
    border-radius: 4px;
}

.github-link {
    margin: 20px 0;
}

.license {
    color: #909399;
    font-size: 12px;
    margin-top: 20px;
}

.dialog-footer {
    display: flex;
    justify-content: center;
    align-items: center;
}

:deep(.el-dialog) {
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
}

:deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    max-height: calc(80vh - 140px);
    /* 减去header和footer高度 */
}

:deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid #e4e7ed;
}
</style>
