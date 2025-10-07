import { CONFIG } from "@/config"
import { RFpulse, spoil, gradPulse, gradRefocus, exciteSpoilRepeat } from "@/Physics/BlochCore"
import { useStateStore, useAppStateStore } from "@/stores/state"

export function useUIEvents() {
    const state = useStateStore()
    const appState = useAppStateStore()

    function buttonAction(label) {
        if (appState.paused) {
            appState.paused = false
        }
        let TR;
        switch (label) {
            // switch scene
            case "进动": state.Sample = "Precession";
                appState.trigSampleChange = true; break;
            case "平衡态": state.Sample = "Equilibrium";
                appState.trigSampleChange = true; break;
            case "不均匀场": state.Sample = "Inhomogeneity";
                appState.trigSampleChange = true; break;
            case "混合物质": state.Sample = "Mixed matter";
                appState.trigSampleChange = true; break;
            case "弱梯度": state.Sample = "Weak gradient";
                appState.trigSampleChange = true; break;
            case "强梯度": state.Sample = "Strong gradient";
                appState.trigSampleChange = true; break;
            case "结构": state.Sample = "Structure";
                appState.trigSampleChange = true; break;
            case "混沌态": state.Sample = "Ensemble";
                appState.trigSampleChange = true; break;
            case "平面": state.Sample = "Plane";
                appState.trigSampleChange = true; break;

            // hard pulse
            case "90°ₓ 强脉冲": RFpulse('rect', Math.PI / 2, Math.PI, 4); break;
            case "90°ʸ 强脉冲": RFpulse('rect', Math.PI / 2, -Math.PI / 2, 4); break;
            case "80°ₓ 强脉冲": RFpulse('rect', Math.PI / 2 / 9 * 8, Math.PI, 4); break;
            case "30°ₓ 强脉冲": RFpulse('rect', Math.PI / 6, Math.PI, 4); break;
            case "30°ʸ 强脉冲": RFpulse('rect', Math.PI / 6, -Math.PI / 2, 4); break;
            case "90°ₓ 强sinc": RFpulse('sinc', Math.PI / 2, Math.PI, 4); break;

            // soft pulse
            case "90°ₓ 弱脉冲": RFpulse('rect', Math.PI / 2, Math.PI, 0.3); break;
            case "90°ʸ 弱脉冲": RFpulse('rect', Math.PI / 2, -Math.PI / 2, 0.3); break;
            case "30°ₓ 弱脉冲": RFpulse('rect', Math.PI / 6, Math.PI, 0.3); break;
            case "30°ʸ 弱脉冲": RFpulse('rect', Math.PI / 6, -Math.PI / 2, 0.3); break;
            case "90°ₓ 弱sinc": RFpulse('sinc', Math.PI / 2, Math.PI, 0.8); break;
            case "180°ʸ 弱sinc": RFpulse('sinc', Math.PI, -Math.PI / 2, 1.6); break;

            // refocus pulse
            case "180°ʸ": RFpulse('rect', Math.PI, -Math.PI / 2, 8); break;
            case "180°ₓ": RFpulse('rect', Math.PI, Math.PI, 8); break;
            case "160°ʸ": RFpulse('rect', Math.PI / 9 * 8, -Math.PI / 2, 8); break;
            case "160°ₓ": RFpulse('rect', Math.PI / 9 * 8, Math.PI, 8); break;

            // spoil
            case "扰相": spoil(); break;
            case "Gx 再聚焦": if (appState.frameFixed) gradRefocus(); break;
            case "Gx 脉冲": if (appState.frameFixed) gradPulse(2); break; // 任何区域
            case "Gy 脉冲": if (appState.frameFixed) gradPulse(2, Math.PI / 2); break; // 任何区域

            // repeat excute action
            case "无重复激发":
                appState.clearRepTimers();
                break;
            case "[90°ₓ] TR=5s,扰相":
                TR = 5000; //ms
                exciteSpoilRepeat(TR, Math.PI / 2, [Math.PI], true);
                break;
            case "[30°ʸ] TR=3s,扰相":
                TR = 3000; //ms
                exciteSpoilRepeat(TR, Math.PI / 6, [-Math.PI / 2], true);
                break;
            case "[90°ʸ] TR=5s,扰相":
                TR = 5000; //ms
                exciteSpoilRepeat(TR, Math.PI / 2, [-Math.PI / 2], true);
                break;
            case "[90°ʸ] TR=8s,扰相":
                TR = 8000; //ms
                exciteSpoilRepeat(TR, Math.PI / 2, [-Math.PI / 2], true);
                break;
            case "[90°ₓ] TR=5s":
                TR = 5000; //ms
                exciteSpoilRepeat(TR, Math.PI / 2, [Math.PI], false);
                break;
            case "[±90°ₓ] TR=5s":
                TR = 5000; //ms
                exciteSpoilRepeat(TR, Math.PI / 2, [Math.PI, 0], false);
                break;
            case "90°ₓ-[180°ʸ]ES=5s":
                let ES = 5000; //ms
                RFpulse('rect', Math.PI / 2, Math.PI, 4);
                window.setTimeout(
                    () => {
                        exciteSpoilRepeat(ES, Math.PI, [-Math.PI / 2],
                            false, 8);
                        appState.restartRepIfSampleChange = true; // 在clearRepTimers()中清除
                    },
                    ES / 2);
                appState.restartRepIfSampleChange = true; // 更改样本后重新开始循环
                break;

            // pause action
            case "||":
                appState.paused = true;
                break;
            case "▶": break;
            default:
                console.warn("未处理的按钮命令:", label)
        }

        if (appState.trigSampleChange && CONFIG.hideWhenSelected) {
            appState.savedFlag = false
        }
    }

    return { buttonAction }
}
