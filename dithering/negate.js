function negate(imdata) {
    "use strict";
    var pos;

    for(var x = 0; x < imdata.height; x++) {
        for(var y = 0; y < imdata.width; y++) {
            // pixel position
            pos = (imdata.width * 4 * y) + (x * 4);
            // channels
            imdata.data[pos] = 255 - imdata.data[pos];
            imdata.data[pos+1] = 255 - imdata.data[pos+1];
            imdata.data[pos+2] = 255 - imdata.data[pos+2];
        }
        postMessage({
            type: "progress",
            val: y / imdata.height * 100
        });
    }
}

onmessage = function(evt) {
    var imdata = evt.data.imdata;

    negate(imdata);

    postMessage({ type: "finished", imdata: imdata });
};
