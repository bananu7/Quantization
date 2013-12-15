
    function calcColorError(a,b,power) {
        return Math.pow(a.r - b.r, power) 
             + Math.pow(a.g - b.g, power)
             + Math.pow(a.b - b.b, power);
    }
    var calcMeansquaredError = function(a,b) { return calcColorError(a,b,2); };
    
    function addColors(a,b) { 
        return {
            r: a.r + b.r,
            g: a.g + b.g,
            b: a.b + b.b
        };
    }
    function multColor(color, f) {
        return { 
            r: color.r * f,
            g: color.g * f,
            b: color.b * f
        };
    }
    
    function getPixelFromImdata(imdata, x,y) {
        var pos = (imdata.width * 4 * y) + (x * 4);
        return {
            r: imdata.data[pos] / 255.0,
            g: imdata.data[pos+1] / 255.0,
            b: imdata.data[pos+2] / 255.0
        };
    }
    function setPixelAtImdata(imdata, x,y, c) {
        var pos = (imdata.width * 4 * y) + (x * 4);
        imdata.data[pos] = c.r * 255;
        imdata.data[pos+1] = c.g * 255;
        imdata.data[pos+2] = c.b * 255;
    }
    function modifyPixelInImdata(imdata,x,y,fn) {
        var c = getPixelFromImdata(imdata, x, y);
        setPixelAtImdata(imdata, x, y, fn(c));
    }
    
    function findClosestPaletteColor (color, palette) {
        "use strict";
        
        var closestMatch, minError = 99999999.9;
        
        palette.forEach(function(c) {
            var err = calcMeansquaredError(color, c);
            if (err < minError) {
                minError = err;
                closestMatch = c;
            }
        });
        return closestMatch;
    }
    
    // algorithms
    function tresholdQuantize(imdata, palette) {
        for (var y = 0; y < imdata.height; ++y) {
            for (var x = 0; x < imdata.width; ++x) {
                var oldpixel = getPixelFromImdata(imdata, x, y);
                var newpixel = findClosestPaletteColor(oldpixel, palette);
                setPixelAtImdata(imdata, x, y, newpixel);
            }
        }
    }
    
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


