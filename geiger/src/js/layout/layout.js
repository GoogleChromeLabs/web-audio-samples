import defaults from 'lodash.defaults'
import dagre from 'dagre';
import { noop } from "../util/util";
import graphlib from 'graphlib';
import { getWorker } from './getWorker';

export const computeLayout = (graph, opt) => {
  opt = defaults(opt || {callback: noop});
  
  // the attrs names of dagre are all lowercase
  const marginx = opt.marginX || 0;
  const marginy = opt.marginY || 0;
  
  const glLabel = {
    rankdir: 'LR',
    marginx,
    marginy
  };
  
  const glGraph = convertToGraphlib(graph, {
    directed: true,
    setNodeLabel,
    setEdgeLabel,
  });

  glGraph.setGraph(glLabel);

  const afterLayout = (glGraph) => {
    convertBackToGraph(glGraph, graph, opt);
    opt.callback(getLayoutBBox(glGraph));
  }
  
  if (opt.useWorker) {
    const myWorker = getWorker(afterLayout);
    // serialize the graph as string and send to worker
    myWorker.postMessage(graphlib.json.write(glGraph));
  } else {
    dagre.layout(glGraph, {debugTiming: true});
    afterLayout(glGraph);
  }

  function getLayoutBBox(glGraph) {
    // Width and height of the graph extended by margins.
    const glSize = glGraph.graph();
    // Return the bounding box of the graph after the layout.
    return {
      marginx,
      marginy,
      width: Math.abs(glSize.width - 2 * marginx),
      height: Math.abs(glSize.height - 2 * marginy)
    };
  }
}

const setNodeLabel = (node) => {
  const {width, height} = node.getSize();
  return {width, height};
}

const setEdgeLabel = (edge) => {
  return {id: edge.id};
}

const convertToGraphlib = (graph, opt) => {
  const glGraph = new dagre.graphlib.Graph();

  const setNodeLabel = opt.setNodeLabel || noop;
  const setEdgeLabel = opt.setEdgeLabel || noop;

  graph.getNodes().forEach(node => {
    glGraph.setNode(node.id, setNodeLabel(node));
  })

  graph.getEdges().forEach(edge => {
    glGraph.setEdge(edge.source.id, edge.target.id, setEdgeLabel(edge))
  })

  return glGraph;
}

const convertBackToGraph = (glGraph, graph) => {

  glGraph.nodes().forEach(nodeId => {
    const nodeLabel = glGraph.node(nodeId);
    // by default, the node position of dagre layout is the center position
    graph.getNode(nodeId).setPos({
      x: nodeLabel.x,
      y: nodeLabel.y,
    });
    // console.log("Node " + nodeId + ": " + JSON.stringify(nodeLabel));
  })

  glGraph.edges().forEach(edge => {
    const edgeLabel = glGraph.edge(edge);

    // save the control points of curve
    graph.getEdge(edgeLabel.id).setPoints(edgeLabel.points);
    // console.log("Edge " + edge.v + " -> " + edge.w  + ": " + JSON.stringify(edgeLabel));
  })

}