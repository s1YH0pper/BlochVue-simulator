import * as THREE from "three";
import { Utils } from "@/utils";
import { VECTORS, CONFIG } from "@/config";
import { useStateStore, useAppStateStore } from "@/stores/state"

const { nullvec, unitZvec } = VECTORS;

const BlochContext = {
    state: null,
    appState: null,
    guiManager: null,
    sceneManager: null,
};

function setBlochContext({ guiManager, sceneManager }) {
    BlochContext.state = useStateStore();
    BlochContext.appState = useAppStateStore();
    BlochContext.guiManager = guiManager;
    BlochContext.sceneManager = sceneManager;
}

function RFconst(B1, B1freq) {
    const { state, appState } = BlochContext;
    let phase = B1freq * state.tSinceRF - state.phi1 + appState.framePhase0;
    return [new THREE.Vector3(B1 * Math.cos(phase), -B1 * Math.sin(phase), 0.), B1];
}


function RFpulse(type, angle, phase, B1) {
    const { state, appState, guiManager } = BlochContext;
    function RFsincWrapper(duration) { // 包装器需要避免重新计算持续时间
        return function RFsinc(B1, B1freq) {
            let phase = B1freq * state.tSinceRF - state.phi1 + appState.framePhase0;
            let sincArg = CONFIG.nZeroSinc * Math.PI * (state.tSinceRF / duration - 1 / 2);
            let envelope = (Math.abs(sincArg) > 0.01) ?
                (B1 * Math.sin(sincArg) / sincArg) : B1;
            return [new THREE.Vector3(envelope * Math.cos(phase),
                -envelope * Math.sin(phase), 0.),
                envelope];
        }
    }

    let gamma = state.Gamma;
    state.tSinceRF = 0; // 脉冲需要面积和时间的乘积，因此需要重置时间
    state.areaLeftRF = angle; // 脉冲剩余的角度
    let duration = angle / (gamma * B1);
    state.B1 = B1;
    state.B1freq = gamma * state.B0;
    let dtAvg = appState.dtMemory.reduce(function (a, b) {
        return a + b
    }, 0) / appState.dtMemory.length;
    phase += state.B1freq * gamma * dtAvg / 2; // 小相位校正
    appState.framePhase0 = appState.framePhase;
    state.phi1 = phase;
    switch (type) {
        case 'rect':
            state.RFfunc = RFconst;
            break;
        case 'sinc':
            duration = duration / CONFIG.durCorrSinc;
            state.RFfunc = RFsincWrapper(duration);
            break;
        default:
            alert('Unknown RF pulse type');
    }
    state.tLeftRF = duration;
    guiManager.updateMenuList.push(guiManager.guiFieldsFolder); // 标记更新的Fields菜单
}

function spoil() {
    const { state, appState } = BlochContext;
    appState.spoilR2 = 4.7;
    window.setTimeout(
        function () {
            appState.spoilR2 = 0;
            if (state.Sample == "Thermal ensemble") return; // 对于ensemble场景不清除
            for (let i = 0; i < state.IsocArr.length; i++) { // 清除所有剩余的横向分量
                state.IsocArr[i].M.projectOnVector(unitZvec);
            }
        }, CONFIG.spoilDuration); // ms
}

function gradPulse(phaseDiff, directionAngle) {
    const { state, guiManager } = BlochContext;
    const gradDur = 1; // s
    state.areaLeftGrad = phaseDiff * CONFIG.gradScale / state.Gamma;
    if (directionAngle) {
        state.Gx = Math.cos(directionAngle) * state.areaLeftGrad / gradDur;
        state.Gy = Math.sin(directionAngle) * state.areaLeftGrad / gradDur;
    } else { // 默认为Gx
        state.Gx = state.areaLeftGrad / gradDur;
        directionAngle = 0;
    }
    state.PulseGradDirection = directionAngle;
    guiManager.updateMenuList.push(guiManager.guiGradientsFolder);
}

function gradRefocus() {
    const { state } = BlochContext;
    let isocArr = state.IsocArr;
    let meanPhaseDiff = 0;
    let MxyLeft, MxyRight;
    let dx, weight;
    let totalWeight = 0;
    let phaseRight; // Right isocs phase
    let phaseDiff; // 相位差
    MxyLeft = isocArr[0].M.clone().projectOnPlane(unitZvec);
    for (let i = 1; i <= isocArr.length - 2; i++) {
        dx = isocArr[i].pos.x - isocArr[i - 1].pos.x;
        if (dx > 0) { // ignore lineshifts in plane
            MxyRight = isocArr[i].M.clone().projectOnPlane(unitZvec);
            weight = Math.min(MxyLeft.length(), MxyRight.length());
            totalWeight += weight;
            phaseRight = Math.atan2(MxyRight.y, MxyRight.x);
            MxyLeft.applyAxisAngle(unitZvec, -phaseRight); //rotate left isoc by right's angle.
            phaseDiff = Math.atan2(MxyLeft.y, MxyLeft.x);
            meanPhaseDiff += weight * phaseDiff / dx;
            MxyLeft = MxyRight; // right is the new left
        }
    }
    if ((Math.abs(meanPhaseDiff) > 0.001) && (totalWeight > 0.01)) {
        meanPhaseDiff = meanPhaseDiff / totalWeight;
        gradPulse(-meanPhaseDiff);
    }
}

function relaxThermal() {
    const { state } = BlochContext;
    let nIsoc = state.IsocArr.length;
    let rep, Mx, My, Mz, Mxy, arg, randomIsocIndi, randomIsoc, R1;
    if (state.T1 != Infinity) {
        R1 = 1 / (state.T1 + 0.1); // 这里不需要准确的精度
        for (rep = 1; rep < Math.floor(nIsoc * R1 / 10); rep++) { //TODO: frame rate needs to enter.
            // 根据T1和nIsoc重复
            Mz = Utils.thermalDrawFromLinearDist(state.B0, CONFIG.B0max); // cosTheta是线性分布的
            Mxy = Math.sqrt(1 - Mz * Mz);
            randomIsocIndi = Math.floor(nIsoc * Math.random());
            randomIsoc = state.IsocArr[randomIsocIndi];
            arg = Math.random() * 2 * Math.PI;
            randomIsoc.M.fromArray([Mxy * Math.cos(arg), Mxy * Math.sin(arg), Mz]);
        }
    }
    else
        R1 = 0;
    // 额外的T2弛豫，如果需要
    let R2 = 1 / (state.T2 + 0.1); // 这里不需要准确的精度
    if (state.T2 != Infinity) {
        for (rep = 1; rep < Math.floor(nIsoc * (R2 - R1) / 10); rep++) { //TODO: frame rate needs to enter.
            randomIsocIndi = Math.floor(nIsoc * Math.random());
            randomIsoc = state.IsocArr[randomIsocIndi];
            Mx = randomIsoc.M.x;
            My = randomIsoc.M.y;
            Mxy = Math.sqrt(Mx * Mx + My * My);
            arg = Math.random() * 2 * Math.PI;
            randomIsoc.M.x = Mxy * Math.cos(arg);
            randomIsoc.M.y = Mxy * Math.sin(arg);
        }
    }
}

function exciteSpoilRepeat(TR, tipAngle, phaseCycle, spoiling, B1) {
    const { state, appState } = BlochContext;
    appState.clearRepTimers();
    B1 = B1 || 4;

    let cycleLength = phaseCycle.length;
    for (let i = 0; i < cycleLength; i++) {
        window.setTimeout(function () {
            RFpulse('rect', tipAngle, phaseCycle[i], B1);
            appState.exciteTimers.push(setInterval(function () {
                RFpulse('rect', tipAngle, phaseCycle[i], B1)
            }, TR * cycleLength));
        }, i * TR);
    }

    if (spoiling) {
        let timeBeforeSpoil = TR - CONFIG.spoilDuration - 200
            - 300 * (state.Sample == '平面'); // 减少需要的平面

        appState.spoilTimer1 = window.setTimeout(function () { spoil() }, timeBeforeSpoil);
        appState.spoilTimer2 = window.setTimeout(function () {
            appState.spoilTimer3 = setInterval(function () {
                spoil()
            }, TR)
        }, timeBeforeSpoil);
    }
}

function BlochStep(dt) {
    const { state, appState, guiManager } = BlochContext;
    state.t += dt;
    state.tSinceRF += dt;

    let gamma = state.Gamma;
    let B0, B1freq;

    if (appState.frameFixed && (!state.FrameStat)) { // 如果帧是固定的，减小B0和B1freq
        if (state.FrameB1) {
            B0 = state.B0 - state.B1freq / gamma;
            B1freq = 0;
        }
        else if (state.FrameB0) {
            B0 = 0;
            B1freq = state.B1freq - state.B0 / gamma;
        }
    }
    else {
        B0 = state.B0;
        B1freq = state.B1freq;
    }


    let Gx = state.Gx;
    let Gy = state.Gy;
    if (state.areaLeftGrad != 0) { // 梯度重新聚焦是否正在进行
        let angle = state.PulseGradDirection;
        let dArea = dt * gamma * (Math.cos(angle) * Gx + Math.sin(angle) * Gy);
        if (Math.abs(dArea) < Math.abs(state.areaLeftGrad)) // 中期脉冲
            state.areaLeftGrad -= dArea;
        else { // last time step
            Gx *= state.areaLeftGrad / dArea * Math.cos(angle);
            Gy *= state.areaLeftGrad / dArea * Math.sin(angle);
            state.areaLeftGrad = 0;
            state.Gx = 0;
            state.Gy = 0;
            guiManager.updateMenuList.push(guiManager.guiGradientsFolder); // 标记梯度文件夹更新
        }
    }

    let B1 = state.B1;
    let B1vec, envelope;
    if (B1 == 0) {
        B1vec = nullvec.clone();
    }
    else if (state.tLeftRF > 0) { // 脉冲
        let retval = state.RFfunc(B1, B1freq);
        B1vec = retval[0];
        envelope = retval[1];
        let dArea = dt * gamma * envelope;
        if (state.tLeftRF < dt) { // 射频脉冲结束
            // 调整B1以匹配共振时的尖端角度(通过添加delta脉冲)
            B1vec.multiplyScalar(state.areaLeftRF / dArea);
            state.areaLeftRF = 0; // 脉冲结束
            state.tLeftRF = 0;
            state.B1 = 0;
            guiManager.updateMenuList.push(guiManager.guiFieldsFolder); // 标记磁场文件夹更新
        } else { // 射频脉冲未结束
            state.areaLeftRF -= dArea;
            state.tLeftRF -= dt;
        }
    } else { // 无脉冲
        // [B1vec, envelope] = state.RFfunc(B1, B1freq); //not IE compatible
        let retval = state.RFfunc(B1, B1freq);
        B1vec = retval[0];
        envelope = retval[1];
    }

    let f1, f2, RelaxFlag, isoc;

    if (state.Sample == 'Thermal ensemble') {
        relaxThermal();
        RelaxFlag = false;
    } else {
        if ((state.T1 == Infinity) && (state.T2 == Infinity)) {
            RelaxFlag = (appState.spoilR2 != 0);
            f1 = 1.; if (RelaxFlag) { f2 = Math.exp(-dt * appState.spoilR2) }
        } else {
            f1 = Math.exp(-dt / state.T1); f2 = Math.exp(-dt * (1. / state.T2 + appState.spoilR2));
            RelaxFlag = true;
        }
    }

    for (let Cspin = 0; Cspin < state.IsocArr.length; Cspin++) {
        isoc = state.IsocArr[Cspin];
        isoc.detuning = isoc.dB0 + (Gx * isoc.pos.x + Gy * isoc.pos.y) / CONFIG.gradScale;
        let Bvec = B1vec.clone().addScaledVector(unitZvec, B0 + isoc.detuning);
        isoc.detuning = (B0 + isoc.detuning) / gamma - B1freq;

        let Bmag = Bvec.length();
        if (Bmag != 0) {
            isoc.M.applyAxisAngle(Bvec.clone().divideScalar(Bmag),
                -Bmag * dt * gamma);
        }

        if (!B1vec.equals(nullvec)) {
            isoc.dMRF.crossVectors(isoc.M, B1vec).multiplyScalar(gamma);// 扭矩
        } else
            isoc.dMRF = nullvec.clone();

        if (RelaxFlag) {
            let df2 = isoc.dR2 ? Math.exp(-isoc.dR2 * dt) : 1; //extra relax for isoc
            let df1 = (isoc.dR1 && ((state.T1 * state.T2) != Infinity) && (appState.spoilR2 == 0)) ?
                Math.exp(-isoc.dR1 * dt) : 1;
            let M0 = isoc.M0 ? isoc.M0 : 1;
            isoc.M.set(isoc.M.x * f2 * df2,
                isoc.M.y * f2 * df2,
                isoc.M.z * f1 * df1 + (1. - f1 * df1) * M0);
        }

        state.IsocArr[Cspin] = isoc;
    }

    // 调试:检查nullvec是否改变过
    if (CONFIG.debug && (!nullvec.equals(new THREE.Vector3(0., 0., 0.)))) {
        alert("nullvec changed!")
    }

    return B1vec;
}

function PhysicalParam(dt) {
    const { state } = BlochContext;
    const B1vec = BlochStep(dt);
    const B1mag = B1vec.length();
    const isochromatData = [];

    let Mtot = nullvec.clone();
    let showTotalCurve = true;

    for (let i = 0; i < state.IsocArr.length; i++) {
        const isoc = state.IsocArr[i];
        const Mvec = isoc.M.clone();
        Mtot.add(Mvec);
        const dMRFvec = isoc.dMRF;

        isochromatData.push({
            Mvec,
            dMRFvec,
            isoc,
            showCurve: isoc.showCurve,
        });

        if (isoc.showCurve) showTotalCurve = false;
    }

    return { B1vec, B1mag, Mtot, showTotalCurve, isochromatData };
}

export {
    BlochContext,
    setBlochContext,
    RFconst,
    RFpulse,
    spoil,
    gradPulse,
    gradRefocus,
    exciteSpoilRepeat,
    PhysicalParam
};

