import { drawNode, updateNode } from "./renderNode";
import { drawEdge, updateEdge } from "./renderEdge";
import Collection from "../util/Collection";

/** Keep track of all groups/objects rendered by fabric.js */
const renderedObjects = new Collection();

const saveRenderedObject = (obj) => {
  if (obj && obj.id) {
    renderedObjects.add(obj.id, obj);
  } else {
    throw new Error('rendered object is not returned or does not have id')
  }
}

export const renderGraph = (canvas, graph) => {
  console.log('start render...')
  const startRenderTime = performance.now();

  // update existing node or add new
  graph.getNodes().forEach(node => {
    let obj;
    if (renderedObjects.has(node.id)) {
      // update existing node
      obj = renderedObjects.get(node.id);
      updateNode(obj, node);
    } else {
      // add new node
      // it is possible that new nodes are added after the layout,
      // but before rendering in the next frame,
      // so those new nodes do not have position and should not render
      if (node.shouldRender()) {
        obj = drawNode(canvas, node);
        saveRenderedObject(obj);
      }
    }
  });
  graph.getNodesToRemove().forEach(node => {
    const obj = renderedObjects.get(node.id);
    canvas.remove(obj);
    renderedObjects.remove(node.id);
  })

  // update existing edge or add new
  graph.getEdges().forEach(edge => {
    let obj;
    if (renderedObjects.has(edge.id)) {
      // update existing edge
      obj = renderedObjects.get(edge.id);
      updateEdge(obj, edge, graph);
    } else {
      // add new edge
      // it is possible that new edges are added after the layout
      // but before rendering in the next frame,
      // so those new edges do not have position and should not render
      if (edge.shouldRender()) {
        obj = drawEdge(canvas, edge, graph);
        saveRenderedObject(obj);
      }
    }
  });
  graph.getEdgesToRemove().forEach(edge => {
    const obj = renderedObjects.get(edge.id);
    canvas.remove(obj);
    renderedObjects.remove(edge.id);
  });

  canvas.requestRenderAll();
  graph.renderEnd();

  console.log('finish render, time spent: ',
    (performance.now() - startRenderTime) / 1000, 's')

  const nodeNum = graph.getNodes().length;
  const edgeNum = graph.getEdges().length;
  console.log('nodeNum:', nodeNum, 'edgeNum:', edgeNum,
    'should render:', nodeNum + edgeNum, 'rendered:', canvas.getObjects().length);
}
