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

    if (B1mag !== 0 && state.viewB1) {
        sceneManager.B1cyl.quaternion.setFromUnitVectors(VECTORS.unitYvec, B1vec.clone().divideScalar(B1mag));
        sceneManager.B1cyl.scale.y = B1mag * CONFIG.B1scale * allScale;
        sceneManager.B1cyl.visible = true;

        if (CONFIG.myShadow) {
            const B1vecTrans = B1vec.clone().projectOnPlane(VECTORS.unitZvec);
            const B1vecTransLength = B1vecTrans.length();

            sceneManager.B1shadow.material = renderShadowMaterial;
            sceneManager.B1shadow.quaternion.setFromUnitVectors(VECTORS.unitYvec, B1vecTrans.clone().divideScalar(B1vecTransLength));
            sceneManager.B1shadow.scale.y = B1vecTransLength * CONFIG.B1scale * allScale;
            sceneManager.B1shadow.visible = true;
        }
    } else {
        sceneManager.B1cyl.visible = false;
        sceneManager.B1shadow.visible = false;
    }

    isochromatData.forEach(({ Mvec, dMRFvec, isoc }) => {
        const MvecLength = Mvec.length();
        isoc.B1eff.visible = false;
        isoc.tshadow.visible = false;

        if (state.FrameB1 && state.viewTorqB1eff && (isoc.detuning !== 0 || appState.frameFixed || isochromatData.length === 1)) {
            const B1eff = B1vec.clone().addScaledVector(VECTORS.unitZvec, isoc.detuning);
            const B1effMag = B1eff.length();
            if (B1effMag !== 0) {
                isoc.B1eff.visible = true;
                isoc.B1eff.quaternion.setFromUnitVectors(VECTORS.unitYvec, B1eff.clone().divideScalar(B1effMag));
                isoc.B1eff.scale.y = B1effMag * CONFIG.B1scale * allScale;
                isoc.B1eff.position.set(isoc.pos.x, isoc.pos.y, isoc.pos.z);

                if (CONFIG.myShadow) {
                    const B1effTrans = B1eff.clone().projectOnPlane(VECTORS.unitZvec);
                    const B1effTransLength = B1effTrans.length();
                    isoc.tshadow.material = renderShadowMaterial;
                    isoc.tshadow.quaternion.setFromUnitVectors(VECTORS.unitYvec, B1effTrans.clone().divideScalar(B1effTransLength));
                    isoc.tshadow.scale.y = B1effTransLength * CONFIG.B1scale * allScale;
                    isoc.tshadow.visible = true;
                }
            }
        }

        if (MvecLength > 0.005) {
            isoc.cylMesh.quaternion.setFromUnitVectors(VECTORS.unitYvec, Mvec.clone().divideScalar(MvecLength));
            isoc.cylMesh.scale.y = MvecLength * allScale;
            isoc.cylMesh.position.set(isoc.pos.x, isoc.pos.y, isoc.pos.z);
            const torqueStart = Mvec.clone().clampLength(0, Mvec.length() * allScale - CONFIG.radius / 2).add(isoc.pos);
            isoc.torque.position.set(torqueStart.x, torqueStart.y, torqueStart.z);
            isoc.cylMesh.visible = true;
            isoc.shadow.visible = true;
        } else {
            isoc.cylMesh.visible = false;
        }

        const MvecTrans = Mvec.clone().projectOnPlane(VECTORS.unitZvec).multiplyScalar(allScale);
        const MvecTransLength = MvecTrans.length();
        if (CONFIG.myShadow && MvecTransLength > 0.005) {
            isoc.shadow.material = renderShadowMaterial;
            isoc.shadow.quaternion.setFromUnitVectors(VECTORS.unitYvec, MvecTrans.clone().divideScalar(MvecTransLength));
            isoc.shadow.position.set(isoc.pos.x, isoc.pos.y, 0);
            isoc.tshadow.position.set(isoc.pos.x, isoc.pos.y, 0);
            isoc.shadow.scale.y = MvecTransLength;
        } else {
            isoc.shadow.visible = false;
        }

        const dMRFvecLength = dMRFvec.length();
        if (dMRFvecLength < 0.01 || !state.viewTorqB1eff || state.FrameB1) {
            isoc.torque.visible = false;
        } else {
            isoc.torque.visible = true;
            isoc.tshadow.visible = true;
            isoc.torque.quaternion.setFromUnitVectors(VECTORS.unitYvec, dMRFvec.clone().divideScalar(dMRFvecLength));
            isoc.torque.scale.y = dMRFvecLength * CONFIG.torqueScale * allScale;
            const dMRFvecTrans = dMRFvec.clone().projectOnPlane(VECTORS.unitZvec);
            const dMRFvecTransLength = dMRFvecTrans.length();

            if (CONFIG.myShadow && dMRFvecTransLength > 0.005) {
                isoc.tshadow.material = renderShadowMaterial;
                isoc.tshadow.quaternion.setFromUnitVectors(VECTORS.unitYvec, dMRFvecTrans.clone().divideScalar(dMRFvecTransLength));
                isoc.tshadow.position.set(isoc.pos.x + MvecTrans.x, isoc.pos.y + MvecTrans.y, 0);
                isoc.tshadow.scale.y = dMRFvecTransLength * CONFIG.torqueScale * allScale;
            } else {
                isoc.tshadow.visible = false;
            }
        }
    });
}

export { Isoc, bindRenderContext, updateB1AndIsochromats };