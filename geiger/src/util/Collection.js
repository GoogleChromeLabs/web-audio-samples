import {isArray} from 'util';
import defaults from 'lodash.defaults';
import {isObject} from './util';

/**
 * @typedef {Object} CollectionOption
 * @property {boolean} trackEnter - If true, Collection will track
 *     newly added items. Need to manually clear.
 * @property {boolean} trackExit - If true, Collection will track
 *     newly removed items. Need to manually clear.
 */

/**
 * A module that supports fast add/remove/get by id.
 * So far, it is just a dictionary, may be updated later.
 * Optionally, it can track the newly added and removed items.
 *
 * @class Collection
 */
export default class Collection {
  /**
   * @constructor
   * @param {?Array<T>} items - Array of items
   * @param {?CollectionOption} option
   */
  constructor(items, option) {
    /**
     * A mapping from event name to a list of event handlers.
     * @type {!Object<string, T>}
     * @private
     */
    this._items = {};

    option = defaults(option, {trackEnter: false, trackExit: false});

    this._trackEnter = option.trackEnter;
    this._trackExit = option.trackExit;

    if (option.trackEnter) {
      /**
       * Store all newly added items, reset by `clearEnterExit`
       * @type {!Array<T>}
       * @private
       */
      this._enter = [];
    }

    if (option.trackExit) {
      /**
       * Store all removed items, reset by `clearEnterExit`
       * @type {!Array<T>}
       * @private
       */
      this._exit = [];
    }

    if (items && isArray(items)) {
      this.addItems(items);
    }
  }

  add(id, item) {
    if (arguments.length !== 2) {
      throw new Error('Should have two arguments, but got: ' +
          arguments.length);
    }
    if (typeof id === 'undefined') {
      throw new Error('id should not be undefined');
    }
    if (this._trackEnter) {
      this._enter.push(item);
    }
    this.set(id, item);
    return this;
  }

  /**
   * Add an array of items, each item should have id.
   * @param {Array<T>} items
   */
  addItems(items) {
    items.forEach((item) => {
      if (isObject(item)) {
        this.add(item.id, item);
      }
    });
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
    if (!this.has(id)) {
      return false;
    }
    if (this._trackExit) {
      this._exit.push(this._items[id]);
    }
    delete this._items[id];
    return true;
  }

  values() {
    return Object.values(this._items);
  }

  size() {
    return Object.keys(this._items).length;
  }

  enter() {
    if (!this._trackEnter) {
      throw new Error('Should set trackEnter=true');
    }
    return this._enter;
  }

  exit() {
    if (!this._trackExit) {
      throw new Error('Should set trackExit=true');
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
