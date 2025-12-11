<template>
    <div id="app">
        <!-- 抽屉 -->
        <transition name="slide-fade">
            <div v-if="drawerVisible" class="custom-drawer">
                <div class="drawer-content">
                    <div id="icons" class="icons">
                        <div class="control-icon" @click="handleXYZViewClick" :title="'视角切换: ' + xyzViewText">
                            {{ xyzViewText }}
                        </div>
                        <br>
                        <div class="control-icon" @click="handleResetCameraClick" title="重置相机">
                            ⏎
                        </div>
                        <br>
                        <div class="control-icon" @click="toggleAxisHelper" title="切换辅助轴显示">⊥</div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 控制箭头按钮 -->
        <button class="drawer-toggle" @click="toggleDrawer">
            <i :class="drawerVisible ? 'el-icon-arrow-right' : 'el-icon-arrow-left'">视角控制</i>
        </button>
    </div>
</template>

<script setup>
import { ref, toRaw } from 'vue'

const props = defineProps({
    sceneContext: {
        type: Object,
        default: null
    }
})

const drawerVisible = ref(false)
const xyzViewText = ref('XYZ')

const toggleDrawer = () => {
    drawerVisible.value = !drawerVisible.value
}

// 相机视角切换处理
const handleXYZViewClick = () => {
    if (!props.sceneContext) return

    const ctx = toRaw(props.sceneContext)
    const { camera, controls, render } = ctx
    let current

    switch (xyzViewText.value) {
        case 'XYZ':
        case 'xyZ':
            current = 'Xyz'
            camera.position.set(6, 0, 0)
            break
        case 'Xyz':
            current = 'xYz'
            camera.position.set(0, 6, 0)
            break
        case 'xYz':
            current = 'xyZ'
            camera.position.set(0, -0.05, 6)
            break
    }

    controls.update()
    xyzViewText.value = current
    render()
}

// 重置相机处理
const handleResetCameraClick = () => {
    if (!props.sceneContext) return

    const ctx = toRaw(props.sceneContext)
    const { controls, render } = ctx
    controls.reset()
    xyzViewText.value = 'XYZ'
    render()
}

// 切换轴辅助器可见度
const toggleAxisHelper = () => {
    props.sceneContext.axisHelper.visible = !props.sceneContext.axisHelper.visible
}
</script>

<style scoped>
/* 按钮固定在右边，垂直位置在窗口的3/4处 */
.drawer-toggle {
    position: fixed;
    top: 75%;
    /* 距离顶部 3/4 高度 */
    right: 0;
    transform: translateY(-50%);
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 8px 0 0 8px;
    width: 32px;
    height: 140px;
    cursor: pointer;
    z-index: auto;
    transition: background-color 0.3s, right 0.3s;
}

.drawer-toggle:hover {
    background-color: #66b1ff;
}

/* 自定义抽屉定位 */
.custom-drawer {
    position: fixed;
    right: 0;
    top: 75%;
    /* 距离顶部 3/4 高度 */
    transform: translateY(-50%);
    width: 100px;
    height: 140px;
    background-color: #fff;
    border-radius: 8px 0 0 8px;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.15);
    z-index: auto;
    overflow: hidden;
}

/* 抽屉内容 */
.drawer-content {
    padding: 20px;
}

/* 平滑动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateX(100%) translateY(-50%);
}
</style>
