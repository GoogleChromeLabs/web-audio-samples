const DB_NAME = 'recordings';
const STORE_NAME = 'audio';

/** Storage for audio blobs in an IndexedDB. */
class IndexedDBStorage {
  /**
   * Asynchronously opens the storage.
   * @return {Promise<void>}
  */
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onerror = reject;
      request.onupgradeneeded = () => {
        // Create ObjectStore on first connection.
        request.result.createObjectStore(STORE_NAME, {autoIncrement: true});
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  /**
   * Asynchronously stores a Blob.
   * @param {Blob} data
   * @return {Promise<number>} Promise resolving with new assigned ID.
   */
  save(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      transaction.onerror = reject;
      // Insert with auto-increment ID.
      const put = transaction.objectStore(STORE_NAME).put(data);
      put.onerror = reject;
      put.onsuccess = (event) => {
        resolve(event.target.result); // Return new inserted ID.
      };
    });
  }

  /**
   * Asynchronously deletes a Blob by its ID.
   * @param {number} id
   * @return {Promise<void>}
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      transaction.onerror = reject;
      transaction.onsuccess = resolve;
      transaction.objectStore(STORE_NAME).delete(id);
    });
  }

  /**
   * Returns an AsyncIterable that yields Promises of [id, blob] tuples.
   * @typedef {[number, Blob]} IdBlob
   * @typedef {IdBlob|undefined} OptionalIdBlob
   * @return {AsyncIterable<IdBlob>}
   */
  readAll() {
    // Store db in local context - `this` is reassigned in next().
    const db = this.db;
    return {
      [Symbol.asyncIterator]() {
        let promise; let cursor;

        /**
         * Loads the next entry.
         * @return {Promise<{done: boolean, value: OptionalIdBlob}>}
         */
        function next() {
          return new Promise((resolve, reject) => {
            // Keep resolve() and reject() in the local scope.
            promise = {resolve, reject};

            if (cursor) {
              // cursor is undefined on the initial invocation, which triggers
              // the data loading. Finally, cursor will be falsey when the
              // previous next() invocation could not return any more data.
              // Cursor being truthy indicates that the previos next()
              // invocation returned data and there might be more. Calling
              // continue() will invoke the onsuccess event handler with the
              // next data entry.
              cursor.continue();
              return;
            }

            const transaction = db.transaction([STORE_NAME]);
            const request = transaction.objectStore(STORE_NAME).openCursor();
            // This event handler is defined only once, but will be called for
            // every stored blob or until the for-await-of loop is exited. The
            // handler needs to resolve the Promise that was returned for the
            // latest next() invocation.
            request.onsuccess = (event) => {
              cursor = event.target.result;
              if (cursor) {
                promise.resolve({
                  value: [cursor.key, cursor.value],
                  done: false,
                });
              } else {
                promise.resolve({done: true});
              }
            };
            request.onerror = (event) => {
              promise.reject(event);
            };
          });
        }

        return {next};
      },
    };
  }
}

export {IndexedDBStorage};
