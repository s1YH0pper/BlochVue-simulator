<template>
    <SceneManager ref="sceneManagerRef" @scene-ready="handleSceneReady" />
    <ControlPanel :sceneContext="sceneContext" :fidContext="fidContext" @panel-ready="handlePanelReady" />
    <UIEvents />
    <el-divider />
    <FIDChart @FID-ready="handleFIDReady" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import SceneManager from '@/components/SceneManager.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import UIEvents from "@/components/UIEvents.vue";
import FIDChart from "@/components/FIDChart.vue";
import { AnimationManager } from '@/manager/AnimationManager'
import { setBlochContext, PhysicalParam } from "@/Physics/BlochCore";
import { bindRenderContext, updateB1AndIsochromats } from "@/Physics/BlochRender";
import { useStateStore, useAppStateStore } from "@/stores/state";
import { useSampleManager } from "@/composables/useSampleManager";

const sceneManagerRef = ref(null)

// 保存初始化上下文
const sceneContext = ref(null)
const panelContext = ref(null)
const fidContext = ref(null)

const state = useStateStore()
const appState = useAppStateStore()

function handleSceneReady(ctx) {
    sceneContext.value = ctx
}

function handlePanelReady(ctx) {
    panelContext.value = ctx
}

function handleFIDReady(ctx) {
    fidContext.value = ctx
}

watch([sceneContext, panelContext], ([scene, panel]) => {
    if (scene && panel) {
        setBlochContext({ guiManager: panelContext.value, sceneManager: sceneContext.value })
        bindRenderContext()
    }
})

onMounted(() => {
    state.Sample = "Precession"
    appState.trigSampleChange = true
    const { sampleChange } = useSampleManager(sceneContext.value, fidContext.value)
    const mainLoop = (dt) => {
        if (dt > 0.1) { return }
        appState.guiTimeSinceUpdate += dt;

        if (panelContext.value.shouldUpdateGUI()) {
            panelContext.value.guiUpdate(sampleChange)
        }

        if (!appState.paused) {
            appState.updateTimeDataAndFramePhase(dt, state);
            const { B1vec, B1mag, Mtot, showTotalCurve, isochromatData } = PhysicalParam(dt);
            updateB1AndIsochromats(B1vec, B1mag, isochromatData);
            fidContext.value.updateFidCurves(isochromatData, Mtot, showTotalCurve, state);
            sceneContext.value.scene.rotation.z = appState.framePhase;
        }
        sceneContext.value.render()
    }

    const animationManager = new AnimationManager(mainLoop)
    animationManager.start()
})

</script>

<style>
html,
body {
    margin: 0;
    padding: 0;
    font-family: "Trebuchet MS", "Helvetica", "Arial", "Verdana", "sans-serif";
    font-size: 100%;
    /* 避免文本高亮（意外剪切/粘贴） */
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    overflow: hidden;
}

body {
    background-color: #000;
}

#app {
    width: 100vw;
    height: 100vh;
    overflow: hidden
}
</style>
