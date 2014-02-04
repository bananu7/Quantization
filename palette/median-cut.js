"use strict";

importScripts(
    "../dithering/common.js",
    "priority-queue.no-require.js"
)

function Node(sampleList) {
    // TODO: possible initial optimalization of range
    var t = {
        samples : sampleList
    };
    t        = findNodeBoundaries(t);
    t.volume = t.rDelta * t.gDelta * t.bDelta;
    return t;
}

function findNodeBoundaries (node) {
    if (node.samples.length === 0)
        return null;
    var rMax = 0.0;
    var rMin = 1.0;
    var gMax = 0.0;
    var gMin = 1.0;
    var bMax = 0.0;
    var bMin = 1.0;
        
    for (var n = 0; n < node.samples.length; n++) {
        rMax = Math.max (rMax, node.samples[n].r);
        gMax = Math.max (gMax, node.samples[n].g);
        bMax = Math.max (bMax, node.samples[n].b);
        
        rMin = Math.min (rMin, node.samples[n].r);
        gMin = Math.min (gMin, node.samples[n].g);
        bMin = Math.min (bMin, node.samples[n].b);
    }
    return {
        rMax : rMax,
        rMin : rMin,
        gMax : gMax,
        gMin : gMin,
        bMax : bMax,
        bMin : bMin,
        rDelta: rMax - rMin,
        gDelta: gMax - gMin,
        bDelta: bMax - bMin,
        samples: node.samples}; 
}

function calcNodeMedian(node) {
    if (node.samples.length === 0)
        return null;

    var delta = Math.max (node.rDelta, node.gDelta, node.bDelta);
    var channel;
    if (delta == node.rDelta) {
        delta = node.rDelta/2 + node.rMin;
        channel = "red";
    }
    else if (delta == node.gDelta) {
        delta = node.gDelta/2 + node.gMin;
        channel = "green";
    }
    else {
        delta = node.bDelta/2 + node.bMin;
        channel = "blue";
    }
    return {value: delta, channel: channel};
}

function calcNodeAverage(node) {
    if (node.samples.length === 0)
        return null;

    var avg = Color(0.0, 0.0, 0.0);
    for (var n = 0; n < node.samples.length; n++) {
        avg = addColors(avg, node.samples[n]);
    }
    avg = multColor(avg, 1.0 / node.samples.length);
    return avg;
}

// separate node samples into 2 subblocks
function divideNode(node) {
    if (node.samples.length === 0)
        return null;
    // calculate median point and axis
    var median = calcNodeMedian(node);
    
    var samplesA = [];
    var samplesB = [];
    for (var n = 0; n < node.samples.length; n++) {
        if ( (median.channel === "red")   && (node.samples[n].r >= median.value)
          || (median.channel === "green") && (node.samples[n].g >= median.value)
          || (median.channel === "blue")  && (node.samples[n].b >= median.value) )
             samplesA.push(node.samples[n]);
        else samplesB.push(node.samples[n]);
    }
    
    return [ Node(samplesA), Node(samplesB) ];
}

function genMedianCutPalette (n, imdata) {
    // generate sample list
    var samples = [];
    for (var y = 0; y < imdata.height; y++) {
        for (var x = 0; x < imdata.width; x++) {
            var c = getPixelFromImdata(imdata, x, y);
            samples.push(c);
        }
    }
    
    // initialize the tree
    var root = Node(samples);
    var queue = PriorityQueue({ comparator: function (a, b) {
        return b.volume * b.samples.length -
               a.volume * a.samples.length;
    } });
    queue.push(root);
    
    while (queue.length < n) {
        // Pick the node with greatest population x volume
        var node = queue.pop();
        // Divide it
        var newNodes = divideNode(node);
        // Enqueue node children as potential candidates
        for (var i = 0; i < 2; ++i) {
            // but only those who have any samples inside
            if (newNodes[i].volume) {
                queue.push(newNodes[i]);
            }
        }
        // Inform about progress
        postMessage({ type: "progress", val: (queue.length / n) * 100.0 });
    }
    
    var palette = [];
    for (var i = 0; i < n; i++) {
        var node = queue.pop();
        palette.push(calcNodeAverage(node));
    }
    return palette;
}

onmessage = function(evt) {
    var imdata = evt.data.imdata;
    var n = 100;
    if (evt.data.paletteSize !== undefined)
        n = evt.data.paletteSize;
    // actually ignore the image in the simple algorithm
    var palette = genMedianCutPalette(n, imdata);
    postMessage({ type : "finished", palette : palette });
}
