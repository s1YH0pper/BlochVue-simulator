import * as THREE from "three";
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { CONFIG } from "../config";

// 工具函数管理器 - 管理各种工具函数
export class Utils {
    // 创建圆柱体网格
    static cylinderMesh(fromVec, toVec, material, nElem, radius) {
        let vec = toVec.clone().sub(fromVec);
        let h = vec.length();
        vec.divideScalar(h || 1);
        let quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
        let geometry = new THREE.CylinderGeometry(radius, radius, h, nElem);
        geometry.translate(0, h / 2, 0);
        let cylinder = new THREE.Mesh(geometry, material);
        cylinder.applyQuaternion(quaternion);
        cylinder.position.set(fromVec.x, fromVec.y, fromVec.z);
        return cylinder;
    }

    // 创建阴影网格
    static shadowMesh(Mvec, radius, shadowMaterial, unitZvec) {
        let MvecTrans = new THREE.Vector2(Mvec.x, Mvec.y);
        let MvecTransLength = MvecTrans.length();

        let orientation = new THREE.Matrix4();
        orientation.lookAt(new THREE.Vector3(0, 0, 0), Mvec.projectOnPlane(unitZvec), new THREE.Object3D().up);
        orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
            0, 0, 1, 0,
            0, -1, 0, 0,
            0, 0, 0, 1));

        let shadowBarGeo = new THREE.PlaneGeometry(2 * radius, MvecTransLength);
        shadowBarGeo.translate(0, MvecTransLength / 2, -1.1);

        let shadowEndGeo = new THREE.CircleGeometry(radius, 4, 0, Math.PI); // 远端只有一个点
        shadowEndGeo.translate(0, MvecTransLength, -1.1);
        let shadowEndMesh = new THREE.Mesh(shadowEndGeo);
        shadowEndMesh.rotation.z = MvecTrans.angle() + Math.PI / 2;

        const geometriesToMerge = [
            shadowBarGeo,
            shadowEndGeo
        ];
        const mergedGeometry = mergeGeometries(geometriesToMerge);
        const mesh = new THREE.Mesh(mergedGeometry, shadowMaterial);
        mesh.applyMatrix4(orientation);

        return mesh;
    }

    // 从线性分布绘制热样本
    static thermalDrawFromLinearDist(B0) {
        const pol = B0 / CONFIG.B0max; // 0到1.0表示均匀分布
        let sample;

        let random = Math.random();
        if (random > pol) // 样本来自均匀的区域，如果随机是gt的最小阈值
            sample = 2 * Math.random() - 1
        else
            sample = 2 * Math.sqrt(Math.random()) - 1; // 线性区域
        return sample;
    }
}