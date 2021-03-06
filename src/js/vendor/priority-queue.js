// PRIORITY QUEUE
// From: https://jsfiddle.net/GRIFFnDOOR/r7tvg/
// Savagely adapted/mangled!

const PriorityQueue = (arr) => {
  const queue = {

    heap: [],

    logHeap: function () {
      let output = 'HEAP - '
      for (let i = 0; i < this.heap.length; i++) {
        output += '[' + this.heap[i][0] + ' / ' + this.heap[i][1] + ']'
      }
      console.log(output)
    },

    length: function () {
      return this.heap.length
    },

    push: function (data, priority) {
      var node = [data, priority]
      this.bubble(this.heap.push(node) - 1)
    },

    // removes and returns the data of lowest priority
    pop: function () {
      return this.heap.pop()[0]
    },

    // removes and returns the data of highest priority
    popHigh: function () {
      return this.heap.shift()[0]
    },

    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    bubble: function (i) {
      while (i > 0) {
        // var parentIndex = i >> 1 // <=> floor(i/2)	// legacy code
        var parentIndex = i - 1

        // if equal, no bubble (maintains insertion order)
        if (!this.isHigherPriority(i, parentIndex)) break

        this.swap(i, parentIndex)
        i = parentIndex
      }
    },

    // swaps the addresses of 2 nodes
    swap: function (i, j) {
      var temp = this.heap[i]
      this.heap[i] = this.heap[j]
      this.heap[j] = temp
    },

    // returns true if node i is higher priority than j
    isHigherPriority: function (i, j) {
      return this.heap[i][1] > this.heap[j][1]
    }

  }

  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      queue.heap.push(arr[i][0], arr[i][1])
    }
  }

  return queue
}

export default PriorityQueue