/**
 * Created by Bajtek on 12/17/13.
 */
importScripts("common.js")

function tresholdQuantize(imdata, palette) {
    for (var y = 0; y < imdata.height; ++y) {
        for (var x = 0; x < imdata.width; ++x) {
            var oldpixel = getPixelFromImdata(imdata, x, y);
            var newpixel = findClosestPaletteColor(oldpixel, palette);
            setPixelAtImdata(imdata, x, y, newpixel);
        }
        postMessage({
            type: "progress",
            val: y / imdata.height * 100
        });
    }
}

onmessage = function(evt) {
    var imdata = evt.data.imdata;
    var palette = evt.data.palette;

    tresholdQuantize(imdata, palette);

    postMessage({ type: "finished", imdata: imdata });
};
