<script setup>

import { onMounted, onUnmounted } from 'vue'
import { Events } from '@wailsio/runtime';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css'

let term = null;
let unsubscribe = null;
let nextSequence = 0;
const pendingChunks = new Map();

const getChunkPayload = (eventPayload) => {
    const raw = eventPayload?.data;

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return {
            seq: Number(raw.seq),
            text: typeof raw.text === 'string' ? raw.text : String(raw.text ?? ''),
        };
    }

    return null;
};

const flushChunks = () => {
    while (pendingChunks.has(nextSequence)) {
        term.write(pendingChunks.get(nextSequence));
        pendingChunks.delete(nextSequence);
        nextSequence += 1;
    }
};

onMounted(() => {
    term = new Terminal({
        cols: 140,
        rows: 100,
        convertEol: true,
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 14,
        fontWeight: 'bold',
        theme: {
            background: '#000000',
            foreground: '#FFFFFF',
            cursor: '#FFFFFF',
            black: '#000000',
            red: '#FF0000',
            green: '#00FF00',
            yellow: '#FFFF00',
            blue: '#0000FF',
            magenta: '#FF00FF',
            cyan: '#00FFFF',
            white: '#FFFFFF',
            brightBlack: '#555555',
            brightRed: '#FF5555',
            brightGreen: '#55FF55',
            brightYellow: '#FFFF55',
            brightBlue: '#5555FF',
            brightMagenta: '#FF55FF',
            brightCyan: '#55FFFF',
            brightWhite: '#FFFFFF'
        }
    });
    term.open(document.getElementById('xterm-container'));

    unsubscribe = Events.On("result_chunk", (data) => {
        const payload = getChunkPayload(data);
        if (!payload || Number.isNaN(payload.seq) || payload.text.length === 0) {
            return;
        }

        pendingChunks.set(payload.seq, payload.text);
        flushChunks();
    });
});

onUnmounted(() => {
    if (typeof unsubscribe === 'function') {
        unsubscribe();
    }
    if (term) {
        term.dispose();
        term = null;
    }
    pendingChunks.clear();
    nextSequence = 0;
});

</script>
<template>
    <div id="xterm-container"></div>
</template>

<style></style>
