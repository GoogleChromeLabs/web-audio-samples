/**
 * A First-In-First-Out (FIFO) class that maintains a queue of
 * elements.  New elements are added to the tail, and the oldest
 * element is removed from the head when the FIFO is full.  If the
 * size of the queue is 1, it will always contain the newest element
 * that was inserted.
 * @class
 */

class FIFO {
  
  /**
   * @constructor
   * @param {Number} size The size of the FIFO.
   */
  constructor(size) {
    /** @private @const {!size} The maximum number of elements that
     * can be stored in the FIFO */
    this.size_ = size;
    /** @private @const {!data} The actual data array for the FIFO. */
    this.data_ = new Float32Array(size);
    /** @private {!head} The index of the first element in the FIFO
     * */
    this.head_ = 0;
    /** @private {!tail} The index of the last element in the FIFO
     * */
    this.tail_ = 0;
    /** @private {!count} The actual number of elements in the FIFO */
    this.count_ = 0;
  }

  /**
   * Push a new value to the tail index of the queue. If the FIFO is
   * full, it removes the element at the head index (the oldest).
   * @param {Number} value The new value to be added to the FIFO.
   */
  push(value) {
    if (this.count_ === this.size_) {
      this.head_ = (this.head_ + 1) % this.size_;
      this.count_--;
    }
    this.data_[this.tail_] = value;
    this.tail_ = (this.tail_ + 1) % this.size_;
    this.count_++;
  }

  /**
   * This method is designed for debugging purposes.
   * @returns {Array} A newly created array contains the elements of
   * the FIFO in the order in which they were added.
   */
  toArray() {
    const result = [];
    let index = this.head_;
    for (let i = 0; i < this.count_; i++) {
      result.push(this.data_[index]);
      index = (index + 1) % this.size_;
    }
    return result;
  }

  /**
   * Find and return the minimum element in the FIFO.
   * @returns {Number}
   */
  getMinValue() {
    return Math.min(...this.data_);
  }
}

export default FIFO;
