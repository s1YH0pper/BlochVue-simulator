import * as THREE from "three";
import { Utils } from "@/utils";
import { VECTORS, CONFIG } from "@/config";
import { BlochContext } from "./BlochCore";

class Isoc {
    static sceneManager = null;

    constructor(M, color, pos, nElem = 8, showCurve = false, dR1 = 0, dR2 = 0, M0 = 1, dRadius = 0) {
        this.M = M.clone();
        this.dB0 = 0;
        this.detuning = 0;
        this.dMRF = new THREE.Vector3(0, 0, 1);
        this.color = color;
        this.pos = pos.clone();
        this.showCurve = showCurve;
        this.dR1 = dR1;
        this.dR2 = dR2;
        this.M0 = (M0 >= 0) ? M0 : 1;
        this.dRadius = dRadius || 0;

        this.cylMesh = this.createMesh("cylinder", color, CONFIG.radius + this.dRadius, nElem);
        this.torque = this.createMesh("cylinder", 0xc80076, CONFIG.radius + this.dRadius, nElem);
        this.B1eff = this.createMesh("cylinder", "blue", 1.01 * (CONFIG.radius + this.dRadius), nElem);
        if (CONFIG.myShadow) {
            this.shadow = this.createMesh("shadow", 0x808070, CONFIG.radius);
            this.tshadow = this.createMesh("shadow", 0x808070, CONFIG.radius);
        }
    }

    scale(scalar) {
        this.M = this.M.multiplyScalar(scalar);
        this.dMRF = this.dMRF.multiplyScalar(scalar);
        return this;
    }

    remove() {
        Isoc.sceneManager.removeFromScene(this.cylMesh);
        Isoc.sceneManager.removeFromScene(this.torque);
        Isoc.sceneManager.removeFromScene(this.B1eff);
        if (CONFIG.myShadow) {
            Isoc.sceneManager.removeFromScene(this.shadow);
            Isoc.sceneManager.removeFromScene(this.tshadow);
        }
    }

    createMesh(type, color, radius, nElem) {
        let mesh;
        if (type === "cylinder") {
            mesh = Utils.cylinderMesh(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.MeshLambertMaterial({ color }),
                nElem,
                radius
            );
        } else if (type === "shadow") {
            mesh = Utils.shadowMesh(
                new THREE.Vector3(0, 1, 0),
                radius,
                new THREE.MeshBasicMaterial({ color }),
                VECTORS.unitZvec
            );
        }
        mesh.castShadow = CONFIG.threeShadow;
        Isoc.sceneManager.addToScene(mesh);
        return mesh;
    }
}

function bindRenderContext() {
    Isoc.sceneManager = BlochContext.sceneManager;
}

function updateB1AndIsochromats(B1vec, B1mag, isochromatData) {
    const { state, appState, sceneManager } = BlochContext;
    const allScale = state.allScale;
    const viewingAngle = sceneManager.controls.getPolarAngle();
    const downViewRatio = 1 - Math.min(viewingAngle / CONFIG.downViewThresh, 1);
    const renderShadowMaterial = sceneManager.shadowMaterials[Math.round(downViewRatio * (CONFIG.nShadowColors - 1))];

    // 性能优化：预计算 B1vec 相关值
    const B1vecX = B1vec.x;
    const B1vecY = B1vec.y;
    const B1vecZ = B1vec.z;
    const B1magInv = B1mag > CONFIG.minVectorLength ? 1 / B1mag : 0;
    const B1scaleAllScale = CONFIG.B1scale * allScale;

    if (B1mag !== 0 && state.viewB1) {
        // 优化：避免不必要的 Vector3 克隆
        sceneManager.B1cyl.quaternion.setFromUnitVectors(VECTORS.unitYvec,
            new THREE.Vector3(B1vecX * B1magInv, B1vecY * B1magInv, B1vecZ * B1magInv));
        sceneManager.B1cyl.scale.y = B1mag * B1scaleAllScale;
        sceneManager.B1cyl.visible = true;

        if (CONFIG.myShadow) {
            // 优化：直接计算投影，避免 clone 和 projectOnPlane
            const B1vecTransLength = Math.sqrt(B1vecX * B1vecX + B1vecY * B1vecY);
            if (B1vecTransLength > CONFIG.minVectorLength) {
                const B1vecTransInv = 1 / B1vecTransLength;
                sceneManager.B1shadow.material = renderShadowMaterial;
                sceneManager.B1shadow.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                    new THREE.Vector3(B1vecX * B1vecTransInv, B1vecY * B1vecTransInv, 0));
                sceneManager.B1shadow.scale.y = B1vecTransLength * B1scaleAllScale;
                sceneManager.B1shadow.visible = true;
            }
        }
    } else {
        sceneManager.B1cyl.visible = false;
        sceneManager.B1shadow.visible = false;
    }

    // 性能优化：使用传统 for 循环替代 forEach，减少函数调用开销
    const dataLength = isochromatData.length;
    for (let i = 0; i < dataLength; i++) {
        const { Mvec, dMRFvec, isoc } = isochromatData[i];
        const MvecLength = Mvec.length();
        isoc.B1eff.visible = false;
        isoc.tshadow.visible = false;

        if (state.FrameB1 && state.viewTorqB1eff && (isoc.detuning !== 0 || appState.frameFixed || dataLength === 1)) {
            // 优化：直接计算 B1eff，避免 Vector3 克隆
            const B1effX = B1vecX;
            const B1effY = B1vecY;
            const B1effZ = B1vecZ + isoc.detuning;
            const B1effMag = Math.sqrt(B1effX * B1effX + B1effY * B1effY + B1effZ * B1effZ);

            if (B1effMag > CONFIG.minVectorLength) {
                const B1effMagInv = 1 / B1effMag;
                isoc.B1eff.visible = true;
                isoc.B1eff.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                    new THREE.Vector3(B1effX * B1effMagInv, B1effY * B1effMagInv, B1effZ * B1effMagInv));
                isoc.B1eff.scale.y = B1effMag * B1scaleAllScale;
                isoc.B1eff.position.set(isoc.pos.x, isoc.pos.y, isoc.pos.z);

                if (CONFIG.myShadow) {
                    // 优化：直接计算投影
                    const B1effTransLength = Math.sqrt(B1effX * B1effX + B1effY * B1effY);
                    if (B1effTransLength > CONFIG.minVectorLength) {
                        const B1effTransInv = 1 / B1effTransLength;
                        isoc.tshadow.material = renderShadowMaterial;
                        isoc.tshadow.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                            new THREE.Vector3(B1effX * B1effTransInv, B1effY * B1effTransInv, 0));
                        isoc.tshadow.scale.y = B1effTransLength * B1scaleAllScale;
                        isoc.tshadow.visible = true;
                    }
                }
            }
        }

        if (MvecLength > CONFIG.minMvecLength) {
            // 优化：避免 Vector3 克隆
            const MvecInv = 1 / MvecLength;
            isoc.cylMesh.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                new THREE.Vector3(Mvec.x * MvecInv, Mvec.y * MvecInv, Mvec.z * MvecInv));
            isoc.cylMesh.scale.y = MvecLength * allScale;
            isoc.cylMesh.position.set(isoc.pos.x, isoc.pos.y, isoc.pos.z);

            // 优化：直接计算 torqueStart
            const torqueLength = Math.max(0, MvecLength * allScale - CONFIG.radius / 2);
            const torqueScale = torqueLength / MvecLength;
            isoc.torque.position.set(
                isoc.pos.x + Mvec.x * torqueScale,
                isoc.pos.y + Mvec.y * torqueScale,
                isoc.pos.z + Mvec.z * torqueScale
            );
            isoc.cylMesh.visible = true;
            isoc.shadow.visible = true;
        } else {
            isoc.cylMesh.visible = false;
        }

        // 优化：直接计算 MvecTrans
        const MvecTransX = Mvec.x * allScale;
        const MvecTransY = Mvec.y * allScale;
        const MvecTransLength = Math.sqrt(MvecTransX * MvecTransX + MvecTransY * MvecTransY);

        if (CONFIG.myShadow && MvecTransLength > CONFIG.minMvecLength) {
            const MvecTransInv = 1 / MvecTransLength;
            isoc.shadow.material = renderShadowMaterial;
            isoc.shadow.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                new THREE.Vector3(MvecTransX * MvecTransInv, MvecTransY * MvecTransInv, 0));
            isoc.shadow.position.set(isoc.pos.x, isoc.pos.y, 0);
            isoc.tshadow.position.set(isoc.pos.x, isoc.pos.y, 0);
            isoc.shadow.scale.y = MvecTransLength;
        } else {
            isoc.shadow.visible = false;
        }

        const dMRFvecLength = dMRFvec.length();
        if (dMRFvecLength < CONFIG.minTorqueLength || !state.viewTorqB1eff || state.FrameB1) {
            isoc.torque.visible = false;
        } else {
            isoc.torque.visible = true;
            isoc.tshadow.visible = true;

            // 优化：避免 Vector3 克隆
            const dMRFvecInv = 1 / dMRFvecLength;
            isoc.torque.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                new THREE.Vector3(dMRFvec.x * dMRFvecInv, dMRFvec.y * dMRFvecInv, dMRFvec.z * dMRFvecInv));
            isoc.torque.scale.y = dMRFvecLength * CONFIG.torqueScale * allScale;

            // 优化：直接计算 dMRFvecTrans
            const dMRFvecTransLength = Math.sqrt(dMRFvec.x * dMRFvec.x + dMRFvec.y * dMRFvec.y);

            if (CONFIG.myShadow && dMRFvecTransLength > CONFIG.minMvecLength) {
                const dMRFvecTransInv = 1 / dMRFvecTransLength;
                isoc.tshadow.material = renderShadowMaterial;
                isoc.tshadow.quaternion.setFromUnitVectors(VECTORS.unitYvec,
                    new THREE.Vector3(dMRFvec.x * dMRFvecTransInv, dMRFvec.y * dMRFvecTransInv, 0));
                isoc.tshadow.position.set(isoc.pos.x + MvecTransX, isoc.pos.y + MvecTransY, 0);
                isoc.tshadow.scale.y = dMRFvecTransLength * CONFIG.torqueScale * allScale;
            } else {
                isoc.tshadow.visible = false;
            }
        }
    }
}

export { Isoc, bindRenderContext, updateB1AndIsochromats };