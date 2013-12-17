
function Color(r, g, b) {
    return {
        r: r,
        g: g,
        b: b
    }
}

function calcColorError(a,b,power) {
    return Math.pow(a.r - b.r, power)
        + Math.pow(a.g - b.g, power)
        + Math.pow(a.b - b.b, power);
}
var calcMeansquaredError = function(a,b) { return calcColorError(a,b,2); };

function addColors(a,b) {
    return Color (
        a.r + b.r,
        a.g + b.g,
        a.b + b.b
    );
}
function multColor(color, f) {
    return Color (
        color.r * f,
        color.g * f,
        color.b * f
    );
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

    for (var i = 0; i < palette.length; i++) {
        var err = calcMeansquaredError(color, palette[i]);
        if (err < minError) {
            minError = err;
            closestMatch = palette[i];
        }
    }
    return closestMatch;
}
