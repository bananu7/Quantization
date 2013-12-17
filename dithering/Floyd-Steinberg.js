
importScripts("common.js")

    function floydSteinberg (imdata, palette, progress) {
        "use strict";
        /* for each y from top to bottom
        for each x from left to right
            oldpixel  := pixel[x][y]
            newpixel  := find_closest_palette_color(oldpixel)
            pixel[x][y]  := newpixel
            quant_error  := oldpixel - newpixel
            pixel[x+1][y  ] := pixel[x+1][y  ] + 7/16 * quant_error
            pixel[x-1][y+1] := pixel[x-1][y+1] + 3/16 * quant_error
            pixel[x  ][y+1] := pixel[x  ][y+1] + 5/16 * quant_error
            pixel[x+1][y+1] := pixel[x+1][y+1] + 1/16 * quant_error
        */
        
        for (var y = 0; y < imdata.height; ++y) {
            for (var x = 0; x < imdata.width; ++x) {
                var oldPixel = getPixelFromImdata(imdata, x, y);
                var newPixel = findClosestPaletteColor(oldPixel, palette);
                setPixelAtImdata(imdata, x, y, newPixel);
                var quantError = calcColorError(oldPixel, newPixel, 1);
                
                modifyPixelInImdata(imdata,x+1,y  , function(c) { return addColors(c, multColor(c, 7/16 * quantError)); });
                modifyPixelInImdata(imdata,x-1,y+1, function(c) { return addColors(c, multColor(c, 3/16 * quantError)); });
                modifyPixelInImdata(imdata,x  ,y+1, function(c) { return addColors(c, multColor(c, 5/16 * quantError)); });
                modifyPixelInImdata(imdata,x+1,y+1, function(c) { return addColors(c, multColor(c, 1/16 * quantError)); });
            }
            progress(y / imdata.height * 100);
        }
    }

onmessage = function(evt) {
    var imdata = evt.data.imdata;
    var palette = evt.data.palette;
    
    floydSteinberg(imdata, palette, function(per) {
        postMessage({
            type: "progress",
            val: per
        });
    });

    postMessage({ type: "finished", imdata: imdata });
};


