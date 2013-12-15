function negate(imdata) {
    "use strict";
    var pos;

    for(var x = 0; x < 500; x++) {
        for(var y = 0; y < 500; y++) {
            // pixel position
            pos = (imdata.width * 4 * y) + (x * 4);
            // channels
            imdata.data[pos] = 255 - imdata.data[pos];
            imdata.data[pos+1] = 255 - imdata.data[pos+1];
            imdata.data[pos+2] = 255 - imdata.data[pos+2];
        }
    }
}

onmessage = function(evt) {
    var imdata = evt.data.imdata;

    negate(imdata);

    postMessage({ type: "finished", imdata: imdata });
};
