<script setup>

import { ref, reactive, onMounted } from 'vue'
import { Events } from '@wailsio/runtime';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css'

onMounted(() => {
    const term = new Terminal({
        cols: 140,
        rows: 100,
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
    Events.On("result", (data) => {
        if (data.data.length > 0) {
            term.write(`${data.data[0]}\r\n`);
        }
    });
});



</script>
<template>
    <div id="xterm-container"></div>
</template>

<style></style>