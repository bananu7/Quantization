"use strict";

importScripts(
    "../dithering/common.js",
    "priority-queue.no-require.js"
)
/*

G   B
^  ^
| /
|/
-------> R

*/
// Code

function calcNodeTreshold(node) {
    return {
        r : (node.rMax - node.rMin) / 2.0 + node.rMin,
        g : (node.gMax - node.gMin) / 2.0 + node.gMin,
        b : (node.bMax - node.bMin) / 2.0 + node.bMin
    };
}

function calcColorProgression(color, treshold) {
    var rOff = color.r > treshold.r ? 1 : 0;
    var gOff = color.g > treshold.g ? 1 : 0;
    var bOff = color.b > treshold.b ? 1 : 0;
    
    function calcQuadrant(rOff, gOff, bOff) {
        // offsets can be 0 or 1
        return rOff * 1 + gOff * 2 + bOff * 4;
    }
    
    return calcQuadrant(rOff, gOff, bOff);
}

function calcNodeAverage(node) {
    if (node.samples.length === 0)
        return undefined;

    var avg = Color(0.0, 0.0, 0.0);
    for (var n = 0; n < node.samples.length; n++) {
        avg = addColors(avg, node.samples[n]);
    }
    avg = multColor(avg, 1.0 / node.samples.length);
    return avg;
}

function Tree(sampleList) {
    // TODO: possible initial optimalization of range
    var t = {
        rMax : 1.0,
        rMin : 0.0,
        gMax : 1.0,
        gMin : 0.0,
        bMax : 1.0,
        bMin : 0.0,
        samples : sampleList
    };
    t.error = calcNodeError(t);
    t.average = calcNodeAverage(t);
    return t;
}

// separate node samples into 8 subblocks
function divideNode(node) {
    // calculate center point
    var tresh = calcNodeTreshold(node);
    //console.log("Dividing node with t=["+tresh.r+","+tresh.g+","+tresh.b+"]");
    
    // create the subnodes
    node.children = [];
    for (var i = 0; i < 8; i++) {
        node.children.push({
            samples : []
        });
    }
    
    function setRanges(node, rMin, rMax, gMin, gMax, bMin, bMax) {
        node.rMax = rMax;
        node.rMin = rMin;
        node.gMax = gMax;
        node.gMin = gMin;
        node.bMax = bMax;
        node.bMin = bMin;
    }
    
    setRanges(node.children[0], node.rMin, tresh.r, node.gMin, tresh.g, node.bMin, tresh.b);
    setRanges(node.children[1], tresh.r, node.rMax, node.gMin, tresh.g, node.bMin, tresh.b);
    setRanges(node.children[2], node.rMin, tresh.r, tresh.g, node.gMax, node.bMin, tresh.b);
    setRanges(node.children[3], tresh.r, node.rMax, tresh.g, node.gMax, node.bMin, tresh.b);
    setRanges(node.children[4], node.rMin, tresh.r, node.gMin, tresh.g, tresh.b, node.bMax);
    setRanges(node.children[5], tresh.r, node.rMax, node.gMin, tresh.g, tresh.b, node.bMax);
    setRanges(node.children[6], node.rMin, tresh.r, tresh.g, node.gMax, tresh.b, node.bMax);
    setRanges(node.children[7], tresh.r, node.rMax, tresh.g, node.gMax, tresh.b, node.bMax);
    
    // reposition samples in subnodes
    for (var i = 0; i < node.samples.length; i++) {
        // offsets can be 0 or 1
        var c = node.samples[i];
        var p = calcColorProgression(c, tresh);
        
        node.children[p].samples.push(c);
    }
    
    // calculate average value for each subnode
    for (var i = 0; i < 8; i++) {
        node.children[i].average = calcNodeAverage(node.children[i]);
        node.children[i].error = calcNodeError(node.children[i]);
    }
}

function findClosestPalletteColor(color, tree) {
    var curr = tree;
    while (curr.children !== undefined) {
        var tresh = calcNodeTresh(curr);
        var p = calcColorProgression(color, tresh);
       
        curr = curr.children[p];
    }
    
    return curr.average;
}

function calcNodeError(node) {
    /* This method uses an absolute average
       difference between each sample in the 
       node and the actual node center point.
       
       This should, in theory, generate bigger
       errors in larger nodes because of the
       samples are located in larger volume.
    */
    if (node.samples.length === 0)
        return undefined;
    
    var tresh = calcNodeTreshold(node);
    var avg = Color(0.0, 0.0, 0.0);
    
    for (var i = 0; i < node.samples.length; i++) {
        var c = node.samples[i];
        avg.r += Math.abs(tresh.r - c.r);
        avg.g += Math.abs(tresh.g - c.g);
        avg.b += Math.abs(tresh.b - c.b);
    }
    
    avg = multColor(avg, 1.0 / node.samples.length);
    
    return colorLength(avg);
}

function genOctreePalette(n, imdata) {
    // generate sample list
    var samples = [];
    for (var y = 0; y < imdata.height; y++) {
        for (var x = 0; x < imdata.width; x++) {
            var c = getPixelFromImdata(imdata, x, y);
            samples.push(c);
        }
    }
    
    // initialize the tree
    var root = Tree(samples);
    root.error = calcNodeError(root);

    var queue = PriorityQueue({ comparator: function (a, b) { return b.error - a.error; } });
    queue.push(root);
    // Each node on the queue represents singular color
    while (queue.length < n) {
        // Pick the node with the current highest error
        var node = queue.pop();
        // Divide it
        divideNode(node);
        // Enqueue node children as potential candidates
        for (var i = 0; i < node.children.length; ++i) {
            // but only those who have any samples inside
            if (node.children[i].average !== undefined) {
                queue.push(node.children[i]);
            }
        }

        // Inform about progress
        postMessage({ type: "progress", val: (queue.length / n) * 100.0 });
    }
    
    //DEBUG
    function printNode(node, level) {
        var tabs = "";
        for (var i = 0; i < level; i++)
            tabs += "\t";
        
        console.log(tabs + "[" + node.rMin + "," + node.rMax + ","
                               + node.bMin + "," + node.bMax + ","
                               + node.gMin + "," + node.gMax + "]");
        if (node.children !== undefined) {
            for (var i = 0; i < 8; i++) {
                printNode(node.children[i], level+1);
            }
        }
    }
    
    var palette = [];
    for (var i = 0; i < n; i++) {
        var node = queue.pop();
        palette.push(node.average);
    }
    return palette;
}

onmessage = function(evt) {
    var imdata = evt.data;
    var n = 100;
    if (evt.data.numColors !== undefined)
        n = evt.data.numcolors;
    // actually ignore the image in the simple algorithm
    var palette = genOctreePalette(n, imdata);
    postMessage({ type : "finished", palette : palette });
}
