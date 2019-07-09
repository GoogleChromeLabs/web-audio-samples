// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


/**
 * A module that can be extended into other classes to equip with
 * 'on', 'off', and 'trigger' features.
 */
export default class Events {
  constructor() {

    /**
     * A mapping from event name to a list of event handlers.
     * @private !Object<string, Array>
     */
    this._events = {};
  }

  /**
   * Bind an event to a callback function.
   * If the name is "all", it will listen to all events.
   */
  on(name, callback, context) {
    if (!name || !callback) return this;

    const handlers = this._events[name] || (this._events[name] = []);
    handlers.push({ callback, context: context || this });

    return this;
  }

  /**
   * Remove one or many callbacks.
   * If `name` is null, removes all callbacks for all events
   * If `callback` is null, removes all callbacks for the event
   */
  off(name, callback) {
    if (!this._events) return this;

    const events = this._events;
    const names = name ? [name] : Object.keys(events);
    names.forEach(name => {
      const handlers = events[name];

      // the event name does not exist
      if (!handlers) return;

      // remove all callbacks for the event
      if (!callback) {
        delete events[name];
        return;
      }

      const remaining = handlers.filter(handler => handler.callback !== callback);
      events[name] = remaining;
    })

    return this;
  }

  /**
   * Trigger events based on name and pass `args` to callback(s).
   * If `name` is null, do nothing;
   * Since `on("all")` is allowed, when an event is triggered,
   * we also fire all the callback(s) bound to "all"
   */
  trigger(name, ...args) {
    if (!this._events || !name) return this;

    const handlers = this._events[name];
    const handlersForAll = this._events["all"];

    if (handlers) {
      this._triggerHandlers(handlers, args);
    }

    if (handlersForAll) {
      this._triggerHandlers(handlersForAll, [name].concat(args));
    }

    return this;
  }

  /** @private */
  _triggerHandlers(handlers, args) {
    handlers.forEach(handler => {
      handler.callback.apply(handler.context, args);
    })
  }
}
