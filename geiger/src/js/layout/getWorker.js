
import graphlib from 'graphlib';
import LayoutWorker from './layout.worker';


const workers = [];
export const getWorker = (callback) => {
  // so far, just use one worker
  if (workers.length) {
    return workers[0];
  }

  const myWorker = new LayoutWorker();
  myWorker.onmessage = function(e) {
    // restore the graph from serialized string
    const glGraph =  graphlib.json.read(e.data);
    callback(glGraph)
  }
  workers.push(myWorker);
  return myWorker;
}
