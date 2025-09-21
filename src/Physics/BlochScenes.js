import * as THREE from "three";
import { COLORS, VECTORS, CONFIG } from "@/config";
import { Isoc } from "./BlochRender";
import { RFconst } from "./BlochCore";

const { white, green, blue, red } = COLORS;
const { nullvec } = VECTORS;

const c30 = Math.cos(30 * Math.PI / 180);
const s30 = Math.sin(30 * Math.PI / 180);
const eps = 0.05;
const xz30 = new THREE.Vector3(s30, 0, c30);
const x = new THREE.Vector3(1, 0, 0);
const y = new THREE.Vector3(0, 1, 0);
const z = new THREE.Vector3(0, 0, 1);
const nx = new THREE.Vector3(-1, 0, 0);
const ny = new THREE.Vector3(0, -1, 0);
const nz = new THREE.Vector3(0, 0, -1);
const xyz = new THREE.Vector3(1 + eps, 1 - eps, 1);
const xynz = new THREE.Vector3(1, 1, -1);
const xnyz = new THREE.Vector3(1 + eps, -1 + eps, 1);
const nxyz = new THREE.Vector3(-1 - eps, 1 - eps, 1);
const nxnyz = new THREE.Vector3(-1 - eps, -1 + eps, 1);
const xnynz = new THREE.Vector3(1, -1, -1);
const nxynz = new THREE.Vector3(-1, 1, -1);
const nxnynz = new THREE.Vector3(-1, -1, -1);

function IsocXz30() { return new Isoc(xz30, white, nullvec); }
function IsocX() { return new Isoc(x, white, nullvec); }
function IsocY() { return new Isoc(y, white, nullvec); }
function IsocZ() { return new Isoc(z, white, nullvec); }
function IsocZensembleRed() { return new Isoc(z, red, nullvec); }
function IsocNX() { return new Isoc(nx, white, nullvec); }
function IsocNY() { return new Isoc(ny, white, nullvec); }
function IsocNZ() { return new Isoc(nz, white, nullvec); }
function IsocXYZ() { return new Isoc(xyz, white, nullvec); }
function IsocXYNZ() { return new Isoc(xynz, white, nullvec); }
function IsocXNYZ() { return new Isoc(xnyz, white, nullvec); }
function IsocNXYZ() { return new Isoc(nxyz, white, nullvec); }
function IsocNXNYZ() { return new Isoc(nxnyz, white, nullvec); }
function IsocXNYNZ() { return new Isoc(xnynz, white, nullvec); }
function IsocNXYNZ() { return new Isoc(nxynz, white, nullvec); }
function IsocNXNYNZ() { return new Isoc(nxnynz, white, nullvec); }

let nElem = 8;
function IsocZgreen() {
    let M0 = 0.91;
    return new Isoc(new THREE.Vector3(0, 0, M0), green, nullvec, nElem, true, 0, 0, M0, 0);
}
function IsocZblue() {
    let M0 = 1.0;
    return new Isoc(new THREE.Vector3(0, 0, M0), blue, nullvec, nElem, true, 0.2, 0.2, M0, 0.001);
}
function IsocZwhite() {
    let M0 = 0.91;
    return new Isoc(new THREE.Vector3(0, 0, M0), white, nullvec, nElem, true, 0, 0.2, M0, 0.0008);
}
function scaleIsocArr(isocArr, factor) {
    isocArr.forEach(item => item.scale(factor));
    return isocArr;
}

const basicState = {
    IsocArr: [],
    B1: 0.0,
    Gamma: 1,
    B0: 2.,
    dt: 0.01,
    phi1: 0.,
    T1: Infinity,
    T2: Infinity,
    B1freq: 5,
    Name: '',
    RFfunc: RFconst
};

const scenes = {
    Isoc1: () => ({ IsocArr: [IsocZ()] }),
    Precession: () => ({ IsocArr: [IsocXz30()] }),
    Equilibrium: () => ({
        IsocArr: [IsocZ()],
        T1: Infinity, T2: Infinity,
        RFfunc: RFconst,
        viewMx: true
    }),
    IsocInhomN: (nIsoc) => {
        let inhom = { IsocArr: [] };
        const spreadScale = 1 / 6;
        const nonlinScale = Math.PI / 1.5; // 减少恢复
        for (let i = 0; i < nIsoc; i++) {
            inhom.IsocArr.push(IsocZ());
            inhom.IsocArr[i].dB0 = Math.tan((i - (nIsoc - 1) / 2) / (nIsoc / nonlinScale)) * spreadScale;
        }
        return inhom;
    },
    Inhomogeneity: () => ({ ...scenes.IsocInhomN(9) }),
    ThermalEnsemble: () => {
        let B0 = CONFIG.B0max;
        const nBand = 100; // 角度分段数
        const perBand = 3;
        let Isocs = [];
        let cosTheta;
        let M = new THREE.Vector3;
        for (let i = 0; i < nBand; i++) {
            cosTheta = i - nBand / 2 + 0.5; // 对称,避免极端
            cosTheta = cosTheta / (nBand / 2); // -1 < cosTheta < 1
            let phi = Math.random() * 2 * Math.PI;
            let perBandAdjusted = Math.round((1 + cosTheta * (B0 / CONFIG.B0max)) * perBand);
            for (let j = 0; j < perBandAdjusted; j++) {
                M.z = cosTheta;
                let Mxy = Math.sqrt(1 - M.z * M.z);
                let arg = phi + (2 * Math.PI) * (j + Math.random() / 2) / perBandAdjusted;
                M.x = Mxy * Math.cos(arg);
                M.y = Mxy * Math.sin(arg);
                Isocs.push(new Isoc(M, white, nullvec));
            }
        }
        return {
            IsocArr: Isocs, viewMz: true, // B0:B0, (低B0以获得更好的视觉效果)
            FrameStat: false, FrameB0: true, FrameB1: false
        };
    },
    ThermalEnsembleSimple: () => {
        let axisVecs = [IsocZensembleRed().scale(1.03), IsocNZ().scale(0.97), IsocX(), IsocY(), IsocNX(), IsocNY()];
        axisVecs[0].color = red;
        let diagVecs = [IsocXYZ(), IsocNXYZ(), IsocXNYZ(), IsocXYNZ(), IsocNXNYZ(), IsocNXYNZ(), IsocXNYNZ(), IsocNXNYNZ()];
        diagVecs = scaleIsocArr(diagVecs, 1 / Math.sqrt(3));
        return { IsocArr: axisVecs.concat(diagVecs) };
    },
    Ensemble: () => scenes.ThermalEnsemble(),
    Substances3: () => {
        let isocs = { IsocArr: [IsocZblue(), IsocZgreen(), IsocZwhite()] };
        isocs.IsocArr[0].dB0 = 0;
        isocs.IsocArr[1].dB0 = -0.04;
        isocs.IsocArr[2].dB0 = 0.04;
        return isocs;
    },
    MixedMatter: () => {
        let mixMatterState = Object.assign({}, basicState);
        mixMatterState.T1 = 8;
        mixMatterState.T2 = 5;
        Object.assign(mixMatterState, scenes.Substances3(), { viewMx: false, viewMxy: true });
        return mixMatterState;
    },
    Line: () => {
        const nIsoc = 21; // choose odd number of isochromates.
        let line = [];
        for (let i = 0; i < nIsoc; i++) {
            line.push(IsocZ());
            line[i].pos.setX((i - (nIsoc - 1) / 2) * 0.4);
        }
        return { IsocArr: line, allScale: 0.35, Gx: 3 };
    },
    LineDense: (uniform) => {
        const nIsoc = 41; // 并不是所有的都实现了结构化对象
        let line = [];
        let shift = 1;
        for (let i = 0; i < nIsoc; i++) {
            if (uniform || ((Math.floor((i - shift) / 3) % 2) == 0)) {
                let isoc = IsocZ();
                isoc.pos.setX((i - (nIsoc - 1) / 2) * 0.2);
                line.push(isoc);
            }
        }
        return { IsocArr: line, allScale: 0.35, Gx: -6 };
    },
    Plane: () => {
        const nIsoc = 21; // choose odd number of isochromates.
        let plane = [];
        for (let i = 0; i < nIsoc; i++) {
            for (let j = 0; j < nIsoc; j++) {
                plane.push(IsocZ());
                plane[i * nIsoc + j].pos.set((j - (nIsoc - 1) / 2) * 0.4, (i - (nIsoc - 1) / 2) * 0.4, 0);
            }
        }
        return { IsocArr: plane, allScale: 0.35 };
    },
    WeakGradient: () => {
        let weakGrad = Object.assign({}, basicState);
        Object.assign(weakGrad, scenes.Line())
        return Object.assign(weakGrad, { B1freq: 3 });
    },
    StrongGradient: (uniform) => {
        let strongGrad = Object.assign({}, basicState);
        Object.assign(strongGrad, scenes.LineDense(uniform));
        return Object.assign(strongGrad, { B1freq: 0, FrameB0: true, FrameB1: false, FrameStat: false });
    }
};

export { basicState, scenes };