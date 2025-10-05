import * as THREE from 'three'

// 配置对象
export const CONFIG = {
    // 性能配置
    fpsInterval: 1000 / 60,
    guiUpdateInterval: 0.1,

    // 物理参数
    Tmax: 10, // 最大有限弛豫时间
    B0max: 6, // 主磁场最大值
    nZeroSinc: 4, // 4表示三瓣正弦
    durCorrSinc: 0.22571, // Si(2 pi)/(2 pi)
    radius: 0.03, // 圆柱半径
    nShadowColors: 16,
    downViewThresh: Math.PI / 4, // 阴影在45度以下减少

    // 缩放参数
    torqueScale: 0.5,
    gradScale: 11,
    B1scale: 0.4,

    // 时间参数
    spoilDuration: 1000,
    FIDduration: 4000, //ms

    // 调试配置
    debug: false,
    reloadSceneResetsParms: false, // 场景主按钮全部重置
    hideWhenSelected: false, // 从场景子菜单中移除所选场景标签
    doStats: false, // 帧速率统计
    addAxisHelper: false, // 添加轴辅助器
    threeShadow: false, // 让Three.js处理阴影
    myShadow: true // 手动绘制的阴影
}

// 颜色配置
export const COLORS = {
    white: new THREE.Color('white'),
    greenStr: 'lawngreen',
    green: new THREE.Color('lawngreen'),
    red: new THREE.Color('red'),
    blueStr: 'dodgerblue',
    blue: new THREE.Color('dodgerblue')
}

// 向量常量
export const VECTORS = {
    nullvec: new THREE.Vector3(0., 0., 0.),
    unitYvec: new THREE.Vector3(0., 1., 0.),
    unitZvec: new THREE.Vector3(0., 0., 1.)
}

// 标签配置 - 移除jQuery依赖，使用DOM API
export const LABEL = {
    eventButtons: document.querySelector('.EventButtons'),
    MxLabelIdent: document.getElementById('MxLabel'),
    MxyLabelIdent: document.getElementById('MxyLabel'),
    MzLabelIdent: document.getElementById('MzLabel')
} 