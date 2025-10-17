import { defineStore } from "pinia";

export const useStateStore = defineStore("state", {
    state: () => ({
        B0: 0,
        B1: 0,
        Gamma: 1,
        B1freq: 0,
        phi1: 0,
        Gx: 0,
        Gy: 0,
        PulseGradDirection: 1,
        lastB1freq: 0,

        T1: Infinity,
        T2: Infinity,

        viewB1: false,
        viewTorqB1eff: true,
        viewMx: true,
        viewMxy: true,
        viewMz: false,
        FrameStat: true,
        FrameB0: false,
        FrameB1: false,

        Sample: "Precession",
        IsocArr: [],
        allScale: 1,
        curveScale: 1,

        t: 0,
        tSinceRF: 0,
        tLeftRF: 0,
        areaLeftRF: 0,
        areaLeftGrad: 0,

        RFfunc: null,
    }),
});

export const useAppStateStore = defineStore("appState", {
    state: () => ({
        savedState: {},
        savedState2: [],
        savedFlag: false,
        paused: false,
        trigSampleChange: false,
        frameFixed: false,
        framePhase: 0,
        framePhase0: 0,
        guiTimeSinceUpdate: 0,
        dtTotal: 0,
        dtCount: 0,
        dtMemory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        dtMemIndi: 0,
        spoilR2: 0,
        restartRepIfSampleChange: false,
        restartRepIfSampleChangeTimer: null,
        spoilTimer1: null,
        spoilTimer2: null,
        spoilTimer3: null,
        exciteTimers: [],
        triggerFIDClear: false,
    }),
    actions: {
        saveState() {
            const state = useStateStore();
            this.savedState = { ...state };
            delete this.savedState.IsocArr

            this.savedState2 = state.IsocArr.map(item => ({
                Mx: item.M.x,
                My: item.M.y,
                Mz: item.M.z,
            }));

            this.savedFlag = true;
        },

        restoreState() {
            const state = useStateStore();
            state.$patch({ ...this.savedState });

            state.IsocArr.forEach((item, index) => {
                if (index >= this.savedState2.length) {
                    console.log('shouldnt happen');
                    return;
                }
                let saved = this.savedState2[index];
                item.M.x = saved.Mx;
                item.M.y = saved.My;
                item.M.z = saved.Mz;
            });

            // 触发FID清理事件
            this.triggerFIDClear = true;
        },

        clearRepTimers() {
            if (this.spoilTimer1) {
                window.clearTimeout(this.spoilTimer1);
                this.spoilTimer1 = null;
            }
            if (this.spoilTimer2) {
                window.clearTimeout(this.spoilTimer2);
                this.spoilTimer2 = null;
            }
            if (this.spoilTimer3) {
                window.clearInterval(this.spoilTimer3);
                this.spoilTimer3 = null;
            }
            if (this.restartRepIfSampleChangeTimer) {
                window.clearTimeout(this.restartRepIfSampleChangeTimer);
                this.restartRepIfSampleChangeTimer = null;
            }

            this.exciteTimers.forEach((item) => {
                window.clearInterval(item);
            });

            this.exciteTimers = [];
            this.restartRepIfSampleChange = false;
        },

        togglePause() {
            this.paused = !this.paused;
            return this.paused;
        },

        updateTimeDataAndFramePhase(dt) {
            const state = useStateStore();
            this.dtTotal += dt;
            this.dtCount++;
            this.dtMemory[this.dtMemIndi] = dt;
            this.dtMemIndi = (this.dtMemIndi + 1) % this.dtMemory.length;

            if (!this.frameFixed) {
                if (state.FrameB0) { this.framePhase += state.B0 * state.Gamma * dt }
                else if (state.FrameB1) { this.framePhase += state.B1freq * dt }
            }
        }
    }
});