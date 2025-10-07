import { reactive } from "vue"
import { basicState, scenes } from "@/Physics/BlochScenes"
import { LABEL } from "@/config"
import { useStateStore, useAppStateStore } from "@/stores/state"
import { useUIEvents } from "@/composables/useUIEvents";

export function useSampleManager(sceneManager, fidManager) {
    const state = useStateStore()
    const appState = useAppStateStore()
    const buttonAction = useUIEvents()
    const MxLabelIdent = LABEL.MxLabelIdent
    const MxyLabelIdent = LABEL.MxyLabelIdent
    const MzLabelIdent = LABEL.MzLabelIdent

    // 用 reactive 管理 UI 状态（比如按钮颜色）
    const uiState = reactive({
        presetsColor: "#ffffff"
    })

    function removeIsocArr() {
        state.IsocArr.forEach((item) => item.remove())
    }

    function sampleChange() {
        if (appState.paused) {
            appState.paused = false
            // 在 Vue 中不直接操作 DOM，而是发事件更新 Pause 按钮
        }

        appState.trigSampleChange = false
        removeIsocArr()
        state.allScale = 1
        state.curveScale = 1

        let sampleObj = Object.assign({}, basicState)

        switch (state.Sample) {
            case 'Precession':
                sampleObj = Object.assign(sampleObj, scenes.Precession());
                state.Sample = '1 isochromate';
                appState.frameFixed = false;
                break;
            case 'Equilibrium':
                sampleObj = Object.assign(sampleObj, scenes.Equilibrium());
                state.Sample = '1 isochromate';
                appState.frameFixed = false;
                break;
            case 'Inhomogeneity':
                sampleObj = Object.assign(sampleObj, scenes.Inhomogeneity());
                state.Sample = '9 isochromates';
                appState.frameFixed = false;
                break;
            case 'Ensemble':
                sampleObj = Object.assign(sampleObj, scenes.Ensemble());
                state.Sample = 'Thermal ensemble';
                state.curveScale = 2;
                appState.frameFixed = false;
                break;
            case 'Weak gradient':
                sampleObj = Object.assign(sampleObj, scenes.WeakGradient());
                appState.frameFixed = true;
                state.Sample = 'Line';
                break;
            case 'Strong gradient':
                sampleObj = Object.assign(sampleObj, scenes.StrongGradient(true));
                appState.frameFixed = true;
                state.Sample = 'Line, dense';
                break;
            case 'Structure':
                sampleObj = Object.assign(sampleObj, scenes.StrongGradient(false));
                appState.frameFixed = true;
                state.Sample = 'Line, structured';
                break;
            case 'Mixed matter':
                sampleObj = Object.assign(sampleObj, scenes.MixedMatter());
                state.Sample = '3 substances';
                appState.frameFixed = false;
                break;
            /* 示例更改: */
            case '1 isochromate':
                sampleObj = Object.assign(sampleObj, scenes.Isoc1());
                appState.frameFixed = false;
                break;
            case '9 isochromates':
                sampleObj = Object.assign(sampleObj, scenes.IsocInhomN(9));
                appState.frameFixed = false;
                break;
            case '3 substances':
                sampleObj = Object.assign(sampleObj, scenes.Substances3());
                appState.frameFixed = false;
                break;
            case 'Thermal ensemble':
                sampleObj = Object.assign(sampleObj, scenes.ThermalEnsemble());
                appState.frameFixed = false;
                break;
            case 'Line':
                sampleObj = Object.assign(sampleObj, scenes.Line());
                appState.frameFixed = true;
                break;
            case 'Line, dense':
                sampleObj = Object.assign(sampleObj, scenes.LineDense(true));
                appState.frameFixed = true;
                break;
            case 'Line, structured':
                sampleObj = Object.assign(sampleObj, scenes.LineDense(false));
                appState.frameFixed = true;
                break;
            case 'Plane':
                sampleObj = Object.assign(sampleObj, scenes.Plane());
                appState.frameFixed = true;
                break;
            default:
                alert("Sample changed to " + state.Sample)
        }

        Object.assign(state, sampleObj)

        // 定时器/重复激发
        if (appState.restartRepIfSampleChange) {
            appState.clearRepTimers()
            appState.restartRepIfSampleChangeTimer = window.setTimeout(() => {
                // 不查 DOM，直接用 Vue 的状态
                buttonAction("RepExc") // or 保留上一次的 label
            }, 4000)
        }

        // 地板材质切换
        sceneManager.floor.material =
            appState.frameFixed && !state.FrameStat
                ? sceneManager.floorMaterialFixed
                : sceneManager.floorMaterial
        sceneManager.initShadowMaterials(sceneManager.floor.material)

        // FID标签显示/隐藏
        fidManager.mxRef.style.display = state.viewMx ? "block" : "none";
        fidManager.mzRef.style.display = state.viewMz ? "block" : "none";
        fidManager.mxyRef.style.display = state.viewMxy ? "block" : "none";

        // FID曲线清理
        fidManager.curves.blue.values.forEach((_, index) => (fidManager.curves.blue.values[index] = 0))
        fidManager.curves.green.values.forEach((_, index) => (fidManager.curves.green.values[index] = 0))
    }

    return {
        sampleChange,
        uiState
    }
}
