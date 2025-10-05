<template>
    <div class="control-panel">
        <div class="gui-container" ref="guiContainer"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as dat from 'dat.gui'
import { CONFIG, LABEL } from '@/config'
import { useStateStore, useAppStateStore } from '@/stores/state'

const emit = defineEmits(["panel-ready"])

const props = defineProps(["sceneContext", "fidContext"])

// 响应式引用
const guiContainer = ref()
const state = useStateStore()
const appState = useAppStateStore()

// GUI 相关变量
let gui = null
let guiFolders = []
let guiFolderStrs = []
let guiFolderFlags = [true, true, true, true, true, true, true, true, true]
let updateMenuList = []
let nFolder = -1
let guiViewsFolder = null
let guiFieldsFolder = null
let guiGradientsFolder = null

// 创建GUI
const createGUI = (containerSelector = '.gui-container') => {
    if (!guiContainer.value) return null

    gui = new dat.GUI({ autoPlace: false })
    guiContainer.value.appendChild(gui.domElement)
    return gui
}

// 添加文件夹
const addFolder = (label) => {
    if (!gui) return null

    const folder = gui.addFolder(label)
    guiFolders.push(folder)
    return folder
}

// 移除文件夹
const removeFolder = (folder) => {
    if (!gui) return

    gui.removeFolder(folder)
    guiFolders = guiFolders.filter(f => f !== folder)
}

// 清理所有文件夹
const clearFolders = () => {
    while (guiFolders.length > 0) {
        removeFolder(guiFolders[0])
    }
    guiFolderStrs = []
}

// 添加Bloch菜单
const addBlochMenu = (cFolder, createFromFolder) => {
    const blochMenu = {
        Reset: () => {
            appState.trigSampleChange = true
        },
    }

    guiAddFolder(
        "Bloch Simulator",
        "Bloch Simulator",
        (guiFolder) => {
            guiFolder.domElement.style.fontWeight = "bold"
            guiFolder.domElement.style.backgroundColor = "transparent"
            guiFolder.add(blochMenu, "Reset").name("重置")
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// 添加弛豫控制
const addRelaxationControls = (cFolder, createFromFolder) => {
    let relaxStr
    if (state.T1 == Infinity && state.T2 == Infinity)
        relaxStr = "Off"
    else if (state.T1 == Infinity)
        relaxStr = "T1 off, T2=" + state.T2
    else
        relaxStr = "T1=" + state.T1 + ", T2=" + state.T2

    guiAddFolder(
        "弛豫: " + relaxStr,
        "弛豫",
        function (guiFolder) {
            const t1Controller = guiFolder
                .add(state, "T1", 0, CONFIG.Tmax, 1)
                .listen()
                .onChange(function () {
                    if (state.T1 == CONFIG.Tmax) {
                        t1Controller.updateDisplay()
                        state.T1 = Infinity
                    }
                    if (state.T2 > state.T1) state.T2 = state.T1
                })

            const t2Controller = guiFolder
                .add(state, "T2", 0, CONFIG.Tmax, 1)
                .listen()
                .onChange(function () {
                    if (state.T1 < state.T2 && appState.spoilR2 == 0)
                        state.T1 = state.T2
                    if (state.T2 == CONFIG.Tmax) {
                        t2Controller.updateDisplay()
                        t1Controller.updateDisplay()
                        state.T2 = Infinity
                        state.T1 = Infinity
                    }
                })
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// 添加图像视图控制
const addImageViewControls = (cFolder, createFromFolder) => {
    let viewStr =
        (state.viewB1 ? "B1场," : "") +
        (state.viewTorqB1eff && !state.FrameB1 ? "扭矩," : "") +
        (state.viewTorqB1eff && state.FrameB1 ? "B1影响," : "") +
        (state.viewMx ? "Mx(实时)," : "") +
        (state.viewMxy ? "|Mxy|(最大)," : "") +
        (state.viewMz ? "Mz(纵向)," : "")
    viewStr = viewStr.slice(0, -1)

    guiAddFolder(
        "图像: " + viewStr,
        "图像",
        (guiFolder) => {
            guiFolder.add(state, "viewB1").name("B1场")
            guiFolder.add(state, "viewTorqB1eff").name("扭矩/B1影响")
            guiFolder
                .add(state, "viewMx")
                .name("Mx(实时)")
                .onChange(() => {
                    if (state.viewMx) props.fidContext.mxRef.style.display = "block"
                    else props.fidContext.mxRef.style.display = "none"
                })
            guiFolder
                .add(state, "viewMxy")
                .name("|Mxy|(最大)")
                .onChange(() => {
                    if (state.viewMxy) props.fidContext.mxyRef.style.display = "block"
                    else props.fidContext.mxyRef.style.display = "none"
                })
            guiFolder
                .add(state, "viewMz")
                .name("Mz(纵向)")
                .onChange(() => {
                    if (state.viewMz) props.fidContext.mzRef.style.display = "block"
                    else props.fidContext.mzRef.style.display = "none"
                })
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// 添加场强控制
const addFieldControls = (cFolder, createFromFolder) => {
    guiAddFolder(
        "场强: B0=" +
        state.B0 +
        ", B1=" +
        Math.round(state.B1 * 10) / 10 +
        ", B1freq=" +
        state.B1freq,
        "场强",
        (guiFolder) => {
            guiFolder.add(state, "B0", 0, CONFIG.B0max, 1)
            guiFolder.add(state, "B1", 0, 3, 0.3)
            guiFolder
                .add(state, "B1freq", 0, CONFIG.B0max, 0.5)
                .listen()
                .onChange(() => {
                    if (appState.frameFixed) {
                        return
                    }
                    const B1freq = state.B1freq
                    appState.framePhase0 += -(B1freq - state.lastB1freq) * state.time.tSinceRF
                    state.lastB1freq = state.B1freq
                })
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// 添加梯度控制
const addGradientsControls = (cFolder, createFromFolder) => {
    guiAddFolder(
        "梯度: Gx=" + Math.round(state.Gx) + ", Gy=" + Math.round(state.Gy),
        "梯度",
        (guiFolder) => {
            guiFolder.add(state, "Gx", -7, 7, 1)
            guiFolder.add(state, "Gy", -7, 7, 1)
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// 添加视角控制
const addFrameControls = (cFolder, createFromFolder) => {
    let FrameStr =
        (state.FrameStat ? "固定" : "") +
        (state.FrameB0 ? "跟随B0" : "") +
        (state.FrameB1 ? "跟随B1" : "")

    guiAddFolder(
        "视角: " + FrameStr,
        "视角",
        function (guiFolder) {
            guiFolder
                .add(state, "FrameStat")
                .name("固定")
                .listen()
                .onChange(() => {
                    state.FrameStat = true
                    state.FrameB0 = false
                    state.FrameB1 = false
                    // 这里需要访问 sceneManager，可以通过 props 传入
                    props.sceneContext.floor.material = props.sceneContext.floorMaterial;
                    if (props.sceneContext.floorMaterial.visible)
                        props.sceneContext.initShadowMaterials(props.sceneContext.floorMaterial);
                })
            guiFolder
                .add(state, "FrameB0")
                .name("跟随B0")
                .listen()
                .onChange(() => {
                    state.FrameStat = false
                    state.FrameB0 = true
                    state.FrameB1 = false
                    let visible = props.sceneContext.floor.material.visible;
                    props.sceneContext.floor.material = appState.frameFixed
                        ? props.sceneContext.floorMaterialFixed
                        : props.sceneContext.floorMaterial;
                    if (visible)
                        props.sceneContext.initShadowMaterials(props.sceneContext.floor.material);
                })
            guiFolder
                .add(state, "FrameB1")
                .name("跟随B1")
                .listen()
                .onChange(() => {
                    state.FrameStat = false
                    state.FrameB0 = false
                    state.FrameB1 = true
                    let visible = props.sceneContext.floor.material.visible;
                    props.sceneContext.floor.material = appState.frameFixed
                        ? props.sceneContext.floorMaterialFixed
                        : props.sceneContext.floorMaterial;
                    if (visible)
                        props.sceneContext.initShadowMaterials(props.sceneContext.floor.material);
                })
        },
        cFolder,
        createFromFolder,
        LABEL.eventButtons
    )
}

// GUI 添加文件夹的通用方法
const guiAddFolder = (
    StrClosed,
    StrOpen,
    AdderFct,
    cFolder,
    createFromFolder,
    eventButtons
) => {
    if (!gui || createFromFolder > 0) return null

    const folderLabel = guiFolderFlags[cFolder] ? StrClosed : StrOpen
    guiFolderStrs.push(folderLabel)
    const guiFolder = gui.addFolder(folderLabel)
    guiFolders.push(guiFolder)
    AdderFct(guiFolder)

    if (createFromFolder < 0) {
        guiFolderFlags[cFolder] = true
    }

    if (guiFolderFlags[cFolder]) {
        guiFolder.close()
        if (cFolder == nFolder)
            eventButtons.css('z-index', 20)
    } else {
        guiFolder.open()
        if (cFolder == nFolder - 1)
            eventButtons.css('z-index', 0)
    }

    return guiFolder
}

// 初始化GUI
const initGUI = (removeFolderArg) => {
    let createFromFolder;
    CONFIG.debug && console.log(
        "guiInit called. Argument: " + (removeFolderArg ? removeFolderArg : "")
    )

    if (!gui) {
        createGUI()
        createFromFolder = 0
    } else {
        createFromFolder = guiFolderStrs.length
        let popped
        do {
            popped = guiFolderStrs.pop()
            removeFolder(guiFolders.pop())
            createFromFolder--
        } while (popped != removeFolderArg && createFromFolder >= 0)
    }

    let cFolder = 0
    addBlochMenu(cFolder++, createFromFolder--)
    addRelaxationControls(cFolder++, createFromFolder--)
    guiViewsFolder = cFolder
    addImageViewControls(cFolder++, createFromFolder--)
    guiFieldsFolder = cFolder
    addFieldControls(cFolder++, createFromFolder--)
    guiGradientsFolder = cFolder
    addGradientsControls(cFolder++, createFromFolder--)
    addFrameControls(cFolder++, createFromFolder--)
}

// GUI 更新
const guiUpdate = (sampleChange) => {
    nFolder = guiFolders.length
    const updateFolder = updateMenuList.shift()

    for (var cFolder = 0; guiFolderFlags[cFolder] == guiFolders[cFolder].closed; cFolder++) {
        if ((updateFolder) && (updateFolder == cFolder)) { break }
        if (cFolder == nFolder - 1) {
            if (appState.trigSampleChange) {
                sampleChange()
                guiFolderFlags = [true, true, true, true, true, true, true, true, true]
                initGUI(guiFolderStrs[1])
            }
            return
        }
    }

    if (!updateFolder)
        guiFolderFlags[cFolder] = !(guiFolderFlags[cFolder])

    for (let cFolder2 = cFolder + 1; cFolder2 < nFolder; cFolder2++) {
        guiFolderFlags[cFolder2] = true
    }

    state.B1 = Math.round(state.B1 * 10) / 10
    initGUI(guiFolderStrs[cFolder])
}

const shouldUpdateGUI = () => {
    if (appState.guiTimeSinceUpdate > CONFIG.guiUpdateInterval) {
        appState.guiTimeSinceUpdate = 0;
        return true;
    }
    return false
}

onMounted(() => {
    initGUI()

    emit("panel-ready", {
        guiFolderFlags,
        guiFolders,
        updateMenuList,
        guiGradientsFolder,
        guiFieldsFolder,
        guiUpdate,
        shouldUpdateGUI,
    })
})

onUnmounted(() => {
    if (gui) {
        gui.destroy()
    }
})
</script>

<style scoped>
.gui-container {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    transform: scale(1.4, 1.4);
}
</style>