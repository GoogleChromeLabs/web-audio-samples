import { isArray } from "util";
import defaults from 'lodash.defaults'

/**
 * A module that supports fast add/remove/get by id.
 * So far, it is just a dictionary, may be updated later.
 */
export default class Collection {
  constructor(items, opt) {
    /**
     * A mapping from event name to a list of event handlers.
     * @private {!Object<string, Item>}
     */
    this._items = {};

    opt = defaults(opt, {trackEnter: false, trackExit: false});

    this._trackEnter = opt.trackEnter;
    this._trackExit = opt.trackExit;

    if (opt.trackEnter) {
      /**
       * Store all newly added items, reset by `clearEnterExit`
       * @private {!Array<Item>}
       */
      this._enter = [];
    }

    if (opt.trackExit) {
      /**
       * Store all removed items, reset by `clearEnterExit`
       * @private {!Array<Item>}
       */
      this._exit = [];
    }

    if (items && isArray(items)) {
      this.addItems(items);
    }
  }

  add(id, item) {
    if (arguments.length !== 2) {
      throw new Error('Should have two arguments');
    }
    if (this._trackEnter) {
      this._enter.push(item);
    }
    this.set(id, item);
    return this;
  }

  addItems(items) {
    items.forEach(item => {
      this.add(item.id, item);
    })
  }

  has(id) {
    return this._items.hasOwnProperty(id);
  }

  get(id) {
    return this._items[id];
  }

  set(id, item) {
    this._items[id] = item;
    return this;
  }

  remove(id) {
    if (this._trackExit && this._items[id]) {
      this._exit.push(this._items[id])
    }
    delete this._items[id];
    return this;
  }

  values() {
    return Object.values(this._items);
  }

  size() {
    return Object.keys(this._items).length;
  }

  enter() {
    if (!this._trackEnter) {
      throw new Error('Should set trackEnter=true')
    }
    return this._enter;
  }

  exit() {
    if (!this._trackExit) {
      throw new Error('Should set trackExit=true')
    }
    return this._exit;
  }

  /** Clear the enter and exit */
  clearEnterExit() {
    if (this._trackEnter) {
      this._enter = [];
    }
    if (this._trackExit) {
      this._exit = [];
    }
  }

}