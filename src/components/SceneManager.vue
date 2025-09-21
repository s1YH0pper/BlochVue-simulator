<template>
    <div class="scene-manager">
        <canvas ref="canvasRef" id="canvasA"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CONFIG, VECTORS } from '@/config'
import { Utils } from '@/utils'

// 响应式引用
const canvasRef = ref(null)

// 向父组件上报初始化完成
const emit = defineEmits(['scene-ready'])

// 场景管理器实例
let scene
let camera
let renderer
let controls
let B1cyl = null
let B1shadow = null

// 地板属性
let floorMaterial = new THREE.MeshLambertMaterial({ color: 0xb0b090 })
let floorMaterialFixed = new THREE.MeshLambertMaterial({ color: 0x90b0d0 })
let floorMaterialBlack = new THREE.MeshLambertMaterial({ color: 0x303030 })
let floorRect
let floorCirc
let floor

// 阴影属性
let shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x808070 })
let shadowMaterials = []
let threeShadow = true

// 初始化渲染器
const initRenderer = () => {
    if (!canvasRef.value) return

    renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.value,
        antialias: true,
        alpha: false
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = threeShadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    return renderer
}

// 初始化相机
const initCamera = () => {
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000)
    camera.up.set(0, 0, 1)
    camera.position.set(2.4, 5.6, 1.5)
    return camera
}

// 初始化控制器
const initControls = () => {
    if (!renderer) return

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.saveState()
    return controls
}

// 初始化 B1 指示器
const initB1 = (radius, myShadow, unitZvec) => {
    const cylMaterial = new THREE.MeshLambertMaterial({ color: "yellow" })
    B1cyl = Utils.cylinderMesh(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 1, 0),
        cylMaterial,
        8,
        radius
    )
    B1cyl.castShadow = threeShadow
    scene.add(B1cyl)

    if (myShadow) {
        B1shadow = Utils.shadowMesh(
            new THREE.Vector3(0, 1, 0),
            radius,
            shadowMaterial,
            unitZvec
        )
        scene.add(B1shadow)
    }
}

// 初始化灯光
const initLight = () => {
    scene.add(new THREE.AmbientLight(0x707070, Math.PI))
    let light = new THREE.DirectionalLight(0xffffff, Math.PI * 2)
    light.castShadow = threeShadow

    // 配置阴影相机
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 500
    light.shadow.camera.left = -50
    light.shadow.camera.right = 50
    light.shadow.camera.top = 50
    light.shadow.camera.bottom = -50

    light.position.set(0, 0, 100)
    scene.add(light)
    scene.add(new THREE.DirectionalLightHelper(light, 0.2))
}

// 初始化地板
const initFloor = (geometry, material) => {
    let floorGeo

    switch (geometry) {
        case 'rect':
            floorGeo = new THREE.PlaneGeometry(10, 10)
            break
        case 'circle':
            floorGeo = new THREE.CircleGeometry(6.5, 64)
            break
        default:
            floorGeo = new THREE.PlaneGeometry(10, 10)
    }

    const floor = new THREE.Mesh(floorGeo, material)
    floor.position.z = -1.101
    floor.receiveShadow = threeShadow
    return floor
}

// 初始化中心阴影
const initOriginShadow = () => {
    if (CONFIG.myShadow) { // 中心点
        let originShadowGeo = new THREE.CircleGeometry(CONFIG.radius, 8, 0, 2 * Math.PI);
        // 点位移误差来自于z-视图的离轴可见性
        let originShadow = new THREE.Mesh(originShadowGeo, shadowMaterial);
        originShadow.position.z = -1.099;
        scene.add(originShadow);
    }
}

// 初始化阴影材质
const initShadowMaterials = (floorMat) => {
    shadowMaterials.length = 0

    for (let i = 0; i < CONFIG.nShadowColors; i++) {
        const material = shadowMaterial.clone()
        if (floorMat instanceof THREE.MeshLambertMaterial) {
            material.color.lerp(floorMat.color, i / CONFIG.nShadowColors * 2.8)
        }
        shadowMaterials.push(material)
    }

    shadowMaterials[CONFIG.nShadowColors - 1].visible = false
}

// 添加到场景
const addToScene = (obj) => {
    scene.add(obj)
}

// 从场景移除
const removeFromScene = (obj) => {
    scene.remove(obj)
}

// 渲染场景
const render = () => {
    if (renderer && camera) {
        renderer.render(scene, camera)
    }
}

// 调整大小
const resize = () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
}

// 初始化场景
const initScene = () => {
    // 初始化属性
    threeShadow = CONFIG.threeShadow

    // 创建场景
    scene = new THREE.Scene()

    // 初始化地板
    floorRect = initFloor("rect", floorMaterial)
    floorCirc = initFloor("circle", floorMaterial)
    floor = floorRect
    floor.receiveShadow = true;
    // 初始化阴影材质
    initShadowMaterials(floorMaterial)
    initOriginShadow()

    // 初始化渲染器、相机、控制器
    initRenderer()
    initCamera()
    initControls()

    // 初始化 B1 和灯光
    initB1(CONFIG.radius, CONFIG.myShadow, VECTORS.unitZvec)
    initLight()

    // 添加地板到场景
    scene.add(floor)

    // 添加轴辅助器（如果需要）
    if (CONFIG.addAxisHelper) {
        const axisHelper = new THREE.AxesHelper(3)
        scene.add(axisHelper)
    }
    render()

    // 上报初始化完成
    emit('scene-ready', {
        scene,
        camera,
        renderer,
        controls,
        floor,
        floorMaterial,
        shadowMaterials,
        B1cyl,
        B1shadow,
        addToScene,
        removeFromScene,
        render,
        initShadowMaterials,
    })
}

// 组件挂载
onMounted(() => {
    initScene()
})

// 组件卸载
onUnmounted(() => {
    // 清理资源
    if (renderer) {
        renderer.dispose()
    }
    if (controls) {
        controls.dispose()
    }
})
</script>

<style scoped>
.scene-manager {
    position: relative;
    width: 100%;
    height: 100%;
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
}
</style>