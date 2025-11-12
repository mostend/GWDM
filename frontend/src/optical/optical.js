import { module } from './module.js';
import { edfa } from './edfa.js';
import { fiber } from './fiber.js';
import { roadm } from './roadm.js';
import { mux } from './mux.js';
import { demux } from './demux.js';
import { olp } from './olp.js';
import { dcm } from './dcm.js'
import { raman } from './raman.js';
import { voa } from './voa.js';

export const optical = {
    Module: module,
    Mux: mux,
    DeMux: demux,
    RAMAN: raman,
    EDFA: edfa,
    Fiber: fiber,
    OLP: olp,
    DCM: dcm,
    ROADM: roadm,
    VOA: voa,
}

export function getCascaderOptions(optical) {
    let cascaderOptions = []
    for (const [key, value] of Object.entries(optical)) {
        cascaderOptions.push({
            label: key,
            value: key,
            children: value.map(item => ({
                label: item.Model,
                value: item.Model
            }))
        });
    }
    return cascaderOptions;
}