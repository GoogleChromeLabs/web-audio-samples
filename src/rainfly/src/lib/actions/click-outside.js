export const nodes = new Map();

/**
 * Listen for clicks outside of the node and call the callback.
 * @param {HTMLElement} node - The node to listen for clicks outside of
 * @param {Function} callback - callback when click outside occurs
 * @return {Object.<string, Function>} Object with destroy method to remove
 */
export const clickOutside = (node, callback) => {
  nodes.set(node, callback);

  return {destroy: () => nodes.delete(node)};
};
