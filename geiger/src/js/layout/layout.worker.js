// WebWorker should use importScripts(),
// but since we are working with webpack, we use regular import.
// More details about how to config Webpack to use Web Worker
// go to README.md

import dagre from 'dagre';
import graphlib from 'graphlib';

onmessage = function(e) {
  // restore the graph from serialized string
  const glGraph = graphlib.json.read(e.data);
  dagre.layout(glGraph);
  // serialize the graph as string and send it back
  postMessage(graphlib.json.write(glGraph));
}