function genQuantizedPalette (n) {
    "use strict";
    var p = [];
    // how many steps each channel will have
    var channelN = Math.floor(Math.pow(n, 1/3));

    for (var r = 0; r <= channelN; r++) {
        for (var g = 0; g <= channelN; g++) {
            for (var b = 0; b <= channelN; b++) {
                p.push({ r: r/channelN, g: g/channelN, b: b/channelN });
            }
        }
    }
    return p;
}

onmessage = function(evt) {
    var imdata = evt.data.imdata;
    var n = 256;
    if (evt.data.paletteSize !== undefined)
        n = evt.data.paletteSize;
    // actually ignore the image in the simple algorithm
    postMessage({ type: "finished", palette: genQuantizedPalette(n)});
}
