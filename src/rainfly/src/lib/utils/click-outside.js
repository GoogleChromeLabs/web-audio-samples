import {nodes} from '$lib/actions/click-outside';

const clickOutsideListener = (/** @type {Event} */ e) =>
  [...nodes.entries()].forEach(([node, callback]) =>
    node !== e.target && callback({
      ...e,
      currentTarget: node,
    }),
  );

export default clickOutsideListener;
