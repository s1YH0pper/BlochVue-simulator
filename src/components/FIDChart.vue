<template>
    <div id="fidbox">
        <canvas ref="axisCanvasRef" id="FIDcanvasAxis"></canvas>
        <canvas ref="fidCanvasRef" id="FIDcanvas"></canvas>
        <div ref="mxyRef" id="MxyLabel">|Mxy|</div>
        <div ref="mxRef" id="MxLabel">Mx</div>
        <div ref="mzRef" id="MzLabel">Mz</div>
    </div>
</template>
<script setup>
import { ref, onMounted, toRaw } from "vue";
import { CONFIG, COLORS, VECTORS } from "@/config";

const emit = defineEmits("FID-ready");

const fidCanvasRef = ref(null);
const axisCanvasRef = ref(null);
const mxyRef = ref(null);
const mxRef = ref(null);
const mzRef = ref(null);
const FIDduration = CONFIG.FIDduration;

let ctx = null;
let ctxAxis = null;
let grWidth = 0;
let grHeight = 0;

const curves = {
    Mx: { times: [], values: [] },
    Mz: { times: [], values: [] },
    Mxy: { times: [], values: [] },
    blue: { times: [], values: [] },
    green: { times: [], values: [] },
};

const initAxis = () => {
    ctxAxis.clearRect(0, 0, grWidth, grHeight);
    ctxAxis.save();
    ctxAxis.strokeStyle = "gray";
    ctxAxis.fillStyle = "gray";
    ctxAxis.lineWidth = 1;
    let offset = 4;

    ctx.translate(offset, grHeight / 2);
    ctx.scale(0.95, 0.95);
    ctx.translate(offset, -grHeight / 2);

    ctxAxis.beginPath();
    ctxAxis.moveTo(offset, 0);
    ctxAxis.lineTo(offset, grHeight);

    let nTick = 8;
    for (let cTick = 1; cTick < nTick; cTick++) {
        ctxAxis.moveTo(-offset, (grHeight * cTick) / nTick);
        ctxAxis.lineTo(offset, (grHeight * cTick) / nTick);
    }
    ctxAxis.stroke();

    ctxAxis.beginPath();
    ctxAxis.moveTo(offset, 0);
    ctxAxis.lineTo(0, 2 * offset);
    ctxAxis.lineTo(2 * offset, 2 * offset);
    ctxAxis.fill();

    ctxAxis.beginPath();
    ctxAxis.moveTo(offset, grHeight / 2);
    ctxAxis.lineTo(grWidth, grHeight / 2);
    ctxAxis.stroke();

    ctxAxis.beginPath();
    ctxAxis.moveTo(grWidth - 2 * offset, grHeight / 2 - offset);
    ctxAxis.lineTo(grWidth, grHeight / 2);
    ctxAxis.lineTo(grWidth - 6, grHeight / 2 + offset);
    ctxAxis.fill();
    ctxAxis.restore();
}

const updateFid = (sample, times, values, color, view, t) => {
    if (isNaN(sample)) return;
    values.push(sample);
    times.push(t);

    const FIDdurSecs = FIDduration / 1000;
    while (times[0] < t - FIDdurSecs) {
        times.shift();
        values.shift();
    }
    if (!view) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = color === COLORS.blueStr ? 3 : 2;
    ctx.translate(0, Math.floor(grHeight / 2));
    ctx.beginPath();

    const len = values.length;
    const FidEnd = times[len - 1];
    const downSample = Math.floor(len / 200) + 1;

    if (downSample === 1) {
        values.forEach((item, index) => {
            ctx.lineTo(
                (1 - (FidEnd - times[index]) / FIDdurSecs) * grWidth,
                -item * grHeight / 2
            );
        });
    } else {
        const timesDownSampled = times.filter((_, i) => i % downSample === 0);
        values.filter((_, i) => i % downSample === 0).forEach((item, index) => {
            ctx.lineTo(
                (1 - (FidEnd - timesDownSampled[index]) / FIDdurSecs) * grWidth,
                -item * grHeight / 2
            );
        });
    }

    ctx.stroke();
    ctx.restore();
}

const updateFidWrap = (Mx, Mz, Mxy, color, state) => {
    switch (toRaw(color)) {
        case COLORS.white:
            updateFid(Mx, curves.Mx.times, curves.Mx.values, "red", state.viewMx, state.t);
            updateFid(Mz, curves.Mz.times, curves.Mz.values, "gray", state.viewMz, state.t);
            updateFid(Mxy, curves.Mxy.times, curves.Mxy.values, "white", state.viewMxy, state.t);
            break;
        case COLORS.green:
            updateFid(
                Mxy,
                curves.green.times,
                curves.green.values,
                COLORS.greenStr,
                state.viewMxy,
                state.t
            );
            break;
        case COLORS.blue:
            updateFid(
                Mxy,
                curves.blue.times,
                curves.blue.values,
                COLORS.blueStr,
                state.viewMxy,
                state.t
            );
            break;
        default:
            alert("color should be specified");
    }
}

const updateFidCurves = (isochromatData, Mtot, showTotalCurve, state) => {
    ctx.clearRect(-5, -5, grWidth + 10, grHeight + 10);

    isochromatData.forEach(({ Mvec, isoc }) => {
        if (isoc.showCurve) {
            updateFidWrap(
                Mvec.x,
                Mvec.z,
                Mvec.projectOnPlane(VECTORS.unitZvec).length(),
                isoc.color,
                state
            );
        }
    });

    if (showTotalCurve) {
        Mtot.multiplyScalar(state.curveScale / state.IsocArr.length);
        updateFidWrap(
            Mtot.x,
            Mtot.z,
            Mtot.projectOnPlane(VECTORS.unitZvec).length(),
            COLORS.white,
            state
        );
    }
}

function clearAll() {
    Object.values(curves).forEach(({ times, values }) => {
        times.length = 0;
        values.length = 0;
    });
    ctx?.clearRect(0, 0, grWidth, grHeight);
}

onMounted(() => {
    const canvas = fidCanvasRef.value;
    const axisCanvas = axisCanvasRef.value;

    ctx = canvas.getContext("2d");
    ctxAxis = axisCanvas.getContext("2d");

    grWidth = canvas.width;
    canvas.height = grWidth;
    axisCanvas.height = grWidth;
    grHeight = canvas.height;

    initAxis()
    emit("FID-ready", {
        mxyRef,
        mxRef,
        mzRef,
        curves,
        updateFidCurves
    })
})
</script>
<style scoped>
#fidbox {
    height: 245px;
    width: 245px;
    padding: 0 0 0 0;
    border: 0 0 0 0;
    background-color: transparent;
    position: absolute;
    top: 1%;
    right: 1%;
}

#FIDcanvasAxis {
    position: absolute;
    z-index: 39;
    height: 100%;
    width: 100%;
}

#FIDcanvas {
    position: absolute;
    z-index: 40;
    height: 100%;
    width: 100%;
}

#MxyLabel {
    position: absolute;
    right: 10px;
    top: 7px;
    z-index: 20;
    font-family: Arial, Helvetica, Geneva, sans-serif;
    color: white;
}

#MxLabel {
    position: absolute;
    right: 10px;
    top: 24px;
    z-index: 20;
    font-family: Arial, Helvetica, Geneva, sans-serif;
    color: red;
}

#MzLabel {
    position: absolute;
    right: 10px;
    top: 41px;
    z-index: 20;
    font-family: Arial, Helvetica, Geneva, sans-serif;
    color: gray;
}
</style>