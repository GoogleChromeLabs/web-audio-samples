import Edge from '../graph/Edge';
import { EdgeTypes } from '../graph/EdgeTypes';
import NodeWithPort from '../graph/NodeWithPort';
import MockMessager from './MockMessager';
import { computeNodeGraphId } from '../graph/label';


const messager = new MockMessager();
// for debug
// const addNodesButton = document.getElementById('add-nodes-btn');
// const removeNodesButton = document.getElementById('remove-nodes-btn');

export const startListening = (graph) => {
  // TODO: does it start with lower-case k or upper-case K?
  messager.on('KNodeCreated', (message) => {
    const node = new NodeWithPort(message);
    node.addTo(graph);
  });
  messager.on('kNodeDestroyed', (message) => {
    const nodeId = computeNodeGraphId(message.contextId, message.nodeId);
    graph.removeNodeAndEdges(nodeId);
  });
  messager.on('KNodesConnected', (message) => {
    const edge = new Edge(message, EdgeTypes.NODE_TO_NODE);
    edge.addTo(graph);
  });
  messager.on('kNodeParamConnected', (message) => {
    const edge = new Edge(message, EdgeTypes.NODE_TO_PARAM);
    edge.addTo(graph);
  });
  messager.on('kNodesDisconnected', (message) => {
    // TODO
  });
  // ??, is there any disconnectNodeParam?

  // addNodesButton.addEventListener('click', (e) => {
  //   messager.addRandomNodesAndLinks(6);
  // });

  // removeNodesButton.addEventListener('click', (e) => {
  //   messager.removeRandomNodesAndLinks(6);
  // });

  // messager.startMock({manualMode: false});

  // Listen to the message sent from the iframe of demo page
  window.addEventListener('message', (event) => {
    // if (!event.origin.startsWith('http://localhost:8000')) return;
    const message = event.data;
    let edge;
    switch (message.eventType) {
      case 'KNodeCreated':
        new NodeWithPort(message).addTo(graph);
        break;
      case 'kNodeDestroyed':
        const nodeId = computeNodeGraphId(message.contextId, message.nodeId);
        graph.removeNodeAndEdges(nodeId);
        break;
      case 'KNodesConnected':
        edge = new Edge(message, EdgeTypes.NODE_TO_NODE);
        edge.addTo(graph);
        break;
      case 'kNodeParamConnected':
        edge = new Edge(message, EdgeTypes.NODE_TO_PARAM);
        edge.addTo(graph);
        break;
      default:
        // console.log(event.data);
        break;
    }
  })

}
