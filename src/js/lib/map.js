import seedrandom from 'seedrandom'
import HEXLIB from '../vendor/hexlib.js'
import PriorityQueue from './priority-queue.js'
import noise from '../vendor/noise.js'

////////////////////////////////////////////////////////////////////////////////
// MAP

export default Map = (config) => { // WTF is this syntax only working here?! (bottom export elsewhere)
  const map = {}

  // RNG & seed
  let mapSeed, RNG

  // ARRAY 2D
  // Create an empty 2D array with given width and height
  const array2d = (width, height) => Array(...Array(width)).map(() => Array(height))

  // CELL STRUCTURE:
  // {
  //   hex,       // Hex
  //   hexOffset, // HexOffset
  //   isInGraph, // Boolean
  //
  //   height,    // Number - the elevation of the tile
  //   moisture,  // Number - the humidity of the tile
  //   biome,     // String - the name of the biome
  //
  //   neighbors, // [Hex] - array of VALID neighbors' hexes
  //   cost,      // Number - CURRENT pathfinding move cost from origin
  //   costs,     // [Number] - array of VALID neighbors' move costs
  //
  //   tile       // BABYLON.Mesh - reference to the tile mesh
  // }
  map.data = array2d(config.mapSize.width, config.mapSize.height)

  // TODO: remove this if proven unnecessary!
  // // Backup configuration
  // map.config = config

  // RANDOMIZE SEED
  // Random seed the noise generator
  map.randomizeSeed = () => {
    map.setSeed(RNG())
  }

  // SET SEED
  map.setSeed = (seed) => {
    console.log(`Map seed set to "${seed}"`)
    mapSeed = seed
    RNG = seedrandom(mapSeed)
    noise.seed(mapSeed)
  }

  // GET CELL FROM HEX
  // Returns a map cell from a given (cubic) hex
  map.getCellFromHex = (hex) => {
    const hexOffset = HEXLIB.hex2Offset(hex, config.mapTopped, config.mapParity)
    if (map.data[hexOffset.col]) {
      if (map.data[hexOffset.col][hexOffset.row]) {
        return map.data[hexOffset.col][hexOffset.row]
      } else {
        console.warn(`Map.getCellFromHex(): unknown row ${hexOffset.row}`)
        return undefined
      }
    } else {
      console.warn(`Map.getCellFromHex(): unknown column ${hexOffset.col}`)
      return undefined
    }
  }

  // MAP POPULATE
  // Fill the 2d array with empty objects
  map.populate = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map.data[x][y] = {}
      }
    }
  }

  // NORMALIZE NOISE
  map.normalizeNoise = (val) => val / 2 + 0.5 // From [-1 1] to [0 1]

  // MAP GET RANGE
  map.mapGetRange = (type) => {
    let minValue = 10000
    let maxValue = -10000

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const value = map.data[x][y][type]
        if (value < minValue) {
          minValue = value
        } else if (value > maxValue) {
          maxValue = value
        }
      }
    }

    return {
      min: minValue,
      max: maxValue
    }
  }

  // MAP LOG RANGE
  map.mapLogRange = (type) => {
    const range = map.mapGetRange(type)
    console.log('MAP RANGE', type, 'min', range.min, 'max', range.max)
  }

  // MAP NORMALIZE
  map.normalizeMap = (type, targetRange) => {
    const range = map.mapGetRange(type)

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const ratio = (map.data[x][y][type] - range.min) / (range.max - range.min)
        const newHeight = ratio * (targetRange - 0.00001)
        map.data[x][y][type] = newHeight
      }
    }
  }

  // MAKE ISLAND
  map.makeIsland = (type) => {
    const halfWidth = Math.floor(config.mapSize.width / 2 + 1),
      halfHeight = Math.floor(config.mapSize.height / 2 + 1)
    const offsetCenter = HEXLIB.hexOffset(halfWidth, halfHeight),
      offsetVertical = HEXLIB.hexOffset(halfWidth, 0),
      offsetHorizontal = HEXLIB.hexOffset(0, halfHeight)

    const hexCenter = HEXLIB.offset2Hex(offsetCenter, config.mapTopped, config.mapParity),
      hexVertical = HEXLIB.offset2Hex(offsetVertical, config.mapTopped, config.mapParity),
      hexHorizontal = HEXLIB.offset2Hex(offsetHorizontal, config.mapTopped, config.mapParity)

    const distanceMaxVertical = HEXLIB.hexDistance(hexCenter, hexVertical)
    const distanceMaxHorizontal = HEXLIB.hexDistance(hexCenter, hexHorizontal)
    const distanceMax = Math.min(distanceMaxVertical, distanceMaxHorizontal)

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const offsetTile = HEXLIB.hexOffset(x, y),
          hexTile = HEXLIB.offset2Hex(offsetTile, config.mapTopped, config.mapParity)

        const distance = HEXLIB.hexDistance(hexTile, hexCenter)
        let ratio = distance / distanceMax // from 0 (border) to 1 (center)
        if (ratio < 0) {
          ratio = 0
        } else if (ratio > 1) {
          ratio = 1
        }
        ratio = 1 - ratio
        ratio = Math.pow(ratio, config.mapPostprocess.height.islandRedistributionPower)
        // Add random peaks to border area of the map (otherwise only 'deepsea')
        if (ratio < 0.5) {
          ratio += (RNG() / 5)
        }
        map.data[x][y][type] *= ratio
      }
    }
  }

  // GET BIOME
  map.getBiome = (height, moisture) => {

    if (height < 1) { return 'deepsea' }
    if (height < 2) { return 'sea' }
    if (height < 3) { return 'shore' }

    if (height < 4) {
      if (moisture < 1) {
        return 'whitebeach'
      } else if (moisture < 3) {
        return 'beach'
      } else {
        return 'swamp'
      }
    }
    if (height < 5) {
      if (moisture < 1) {
        return 'desert'
      } else if (moisture < 3) {
        return 'grass'
      } else {
        return 'plain'
      }
    }
    if (height < 6) {
      if (moisture < 1) {
        return 'grass'
      } else if (moisture < 3) {
        return 'plain'
      } else {
        return 'forest'
      }
    }
    if (height < 7) {
      if (moisture < 1) {
        return 'plain'
      } else if (moisture < 3) {
        return 'forest'
      } else {
        return 'deepforest'
      }
    }
    if (height < 8) {
      if (moisture < 1) {
        return 'mountain'
      } else if (moisture < 2) {
        return 'forest'
      } else if (moisture < 3) {
        return 'deepforest'
      } else {
        return 'pineforest'
      }
    }

    if (height < 9) {
      if (moisture < 1) {
        return 'mountain'
      } else if (moisture < 3) {
        return 'highmountain'
      } else {
        return 'pineforest'
      }
    }
    if (height < 10) {
      if (moisture < 2) {
        return 'scorched'
      } else {
        return 'snow'
      }
    }
    return 'ice'
  }

  // CREATE MAP BIOMES
  map.createMapBiomes = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map.data[x][y].biome = map.getBiome(map.data[x][y].height, map.data[x][y].moisture)
      }
    }
  }

  // CREATE NOISE
  map.createNoise = (type, x, y) => {
    const nz = [] // noize
    let value = 0;

    for (let h = 0; h < config.mapNoise[type].harmonics.length; h++) {
      const frequencyDivider =
        config.mapNoise[type].frequency /
        Math.pow(2, h)

    nz[h] = map.normalizeNoise(
      noise.simplex2(
        x / frequencyDivider,
        y / frequencyDivider
      )
    )

    // Redistribution (raise the elevation to a power)
    nz[h] = Math.pow(
      nz[h],
      config.mapPostprocess[type].redistributionPower
    )

    // Revert values
    if (config.mapPostprocess[type].revert) {
      nz[h] = 1 - nz[h]
    }

    value += nz[h] * config.mapNoise[type].harmonics[h]
  }
  return value
}

  // CREATE MAP
  map.createMap = () => {
    // Procedural map generation
    map.createMapData('height', config.mapValueRange.height)
    map.createMapData('moisture', config.mapValueRange.moisture)
    map.createMapBiomes()
  }

  // CREATE MAP DATA
  map.createMapData = (type, range) => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {

        let value = 0 // From 0 to 1

        if (config.mapNoise[type].stupidRandom) {
          // Stupid random value
          value = RNG()
        } else {
          // Noise based value
          value = map.createNoise(type, x, y)
        }
        map.data[x][y][type] = value * range
      }
    }

    // Island mode
    if (config.mapPostprocess[type].islandMode) {
      map.makeIsland(type)
    }

    // Normalizing values
    if (config.mapPostprocess[type].normalize) {
      map.normalizeMap(type, config.mapValueRange[type])
    }
  }

  // IS VALID CELL
  // Tells if the cell is part of the graph or not
  map.isValidCell = (cell) => {
    return map.isValidBiome(cell.biome)
  }

  // IS VALID BIOME
  // Tells if the cell's biome is part of the graph
  map.isValidBiome = (biome) => {
    // The biomes we can't move on
    return (biome !== 'deepsea' && biome !== 'sea' && biome !== 'shore')
  }

  // IS HEX ON MAP
  // Is the hex within the map boundaries?
  map.isHexOnMap = (hex) => {
    const hexOffset = HEXLIB.hex2Offset(hex, config.mapTopped, config.mapParity)

    return (hexOffset.col >= 0 &&
      hexOffset.row >= 0 &&
      hexOffset.col < config.mapSize.width &&
      hexOffset.row < config.mapSize.height)
  }

  // GET MOVE COST
  map.getMoveCost = (fromHeight, toHeight, toBiome) => {
    let cost = 1,
        heightCost = toHeight - fromHeight

    // Heightcost is positive when we move upward
    // In case we're moving down, limit the negative cost (aka gain) by scaling down
    if (heightCost < 0) {
      heightCost /= 4
    }
    cost = 1 + heightCost

    if (toBiome === 'shore') {
      cost *= 2
    }
    if (toBiome === 'mountain' ||
      toBiome === 'highmountain') {
      cost *= 3
    }
    if (toBiome === 'scorched' ||
      toBiome === 'snow' ||
      toBiome === 'ice') {
      cost *= 4
    }
    return cost
}

  // MAP GRAPH
  // Build the pathfinding graph, into the map
  map.generateGraph = () => {

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {

        const hexOffset = HEXLIB.hexOffset(x, y),
              hex = HEXLIB.offset2Hex(hexOffset, config.mapTopped, config.mapParity),
              neighborsAll = HEXLIB.hexNeighbors(hex),
              neighbors = [], // VALID neighbors of the cell
              costs = [], // Move costs to VALID neighbors
              cell = map.data[x][y] // Reference to the cell map data

        // Add the cell to graph if the height is valid
        cell.isInGraph = map.isValidCell(cell)

        if (cell.isInGraph) {
          // Each (eventual) neighbor of the cell
          for (const neighbor of neighborsAll) {
            // Is the neighbor on/in the map?
            if (map.isHexOnMap(neighbor)) {
              // Get the neigbor cell
              const neighborCell = map.getCellFromHex(neighbor)

              // Is the neighbor a valid move?
              if (map.isValidCell(neighborCell)) {
                const cost = map.getMoveCost(
                  cell.height, 
                  neighborCell.height, 
                  neighborCell.biome
                )
                costs.push(cost)	// add the edge cost to the graph

                // ADD EGDE
                neighbors.push(neighbor)
              }
            }
          }
        }

        // Backup things into cell
        cell.hex = hex
        cell.hexOffset = hexOffset
        cell.neighbors = neighbors
        cell.costs = costs
      }
    }
    // console.warn('MAP', map.data)
  }

  //////////////////////////////////////////////////////////////////////////////
  // PATH FINDING

  // FIND FROM HEX
  // Return a value from an hex index
  // As we have no string hex notation, we use hex objects as 'indexes'
  // in a data 2d array: [hex][value]
  map.getFromHex = (data, hex) => {
    for (const d of data) {
      if (HEXLIB.hexEqual(d[0], hex)) {
        return d[1]
      }
    }
    return undefined
  }

  // SET FROM HEX
  // Replace or add a value from an hex index in a data 2d array: [hex][value]
  map.setFromHex = (data, hex, value) => {
    let isSet = false
    for (const d of data) {
      if (HEXLIB.hexEqual(d[0], hex)) {
        d[1] = value
        isSet = true
        break
      }
    }
    if (!isSet) {
      data.push([hex, value])
    }
  }

  // GET INDEX HEXES
  // Return an array of hexes from an array with theses hexes as indexes
  // Same principle as map.getFromHex(), see above
  map.getIndexHexes = (data) => {
    const hexes = []
    for (const d of data) {
      hexes.push(d[0])
    }  
    return hexes
  }  

  // RESET COSTS
  // Reset all move costs to max value
  map.resetCosts = () => {
    for (let y = 0; y < config.mapSize.height; y++) {
      for (let x = 0; x < config.mapSize.width; x++) {
        map.data[x][y].cost = 100000000
      }
    }
  }

  // FIND PATH
  // Find a path between 2 hexes, using a A-star algorithm
  // From: 
  //	http://www.redblobgames.com/pathfinding/a-star/introduction.html
  //	http://www.redblobgames.com/pathfinding/a-star/implementation.html
  map.findPath = (start, goal, earlyExit = true, blacklist) => {

    // if (!map.getCellFromHex(start).isInGraph) console.warn('A*: start hex is NOT in graph!')
    // if (!map.getCellFromHex(goal).isInGraph) console.warn('A*: goal hex is NOT in graph!')

    map.resetCosts()

    // List of the places that are still to be explored (close to our zone)
    // [hex, priority, hex, priority, hex, priority...]
    // Note: priority is reversed, lower priority will come first
    const frontier = PriorityQueue()
    frontier.push(start, 0)

    // List of places where we've already been, with the previous place
    // [[hex, previousHex], [hex, previousHex], [hex, previousHex]...]
    const cameFrom = []
    cameFrom.push([start, undefined])

    // Total movement cost from the start location to a given hex
    // [[hex, cost], [hex, cost], [hex, cost]...]
    // See: https://www.redblobgames.com/pathfinding/a-star/introduction.html#dijkstra
    const costSoFar = []
    costSoFar.push([start, 0])

    // Have we reached the goal?
    let found = false

    // Loop while there are still frontier hexes to explore
    while (frontier.length() > 0) {
      // Remove and return the hex of lowest priority/cost
      const currentHex = frontier.pop()
      // Get the associated cell
      const currentCell = map.getCellFromHex(currentHex)
      // if (!currentCell.isInGraph) console.error('A*: current hex is NOT in graph!')

      // Get the neighbors and their associated costs
      // const	neighbors = arrayShuffle(currentCell.neighbors)	// cheapo edge breaks
      const neighbors = currentCell.neighbors
      const neighborsCosts = currentCell.costs

      // Are we looking for a specific goal?
      if (goal) {
        // Have we reached this goal?
        if (HEXLIB.hexEqual(currentHex, goal)) {
          found = true
          // Early exit (stop exploring map when goal is reached)
          // See: https://www.redblobgames.com/pathfinding/a-star/introduction.html#early-exit
          if (earlyExit) break
        }
      }

      // For each neighbor
      for (let n = 0; n < neighbors.length; n++) {
        // Is the neighbor in the graph? (it should, otherwise the graph is broken!)
        if (!map.getCellFromHex(neighbors[n]).isInGraph) {
          console.error('map.findPath(): neighbor NOT in graph!', neighbors[n])
        }
        // Skip this location if blacklisted
        if (blacklist && HEXLIB.hexIndexOf(blacklist, neighbors[n]) !== -1) {
          continue
        }

        const next = neighbors[n],
              // cost of the move from current hex to this neighbor hex
              nextCost = neighborsCosts[n],
              // cost from start to this neighbor
              newCost =
                map.getFromHex(costSoFar, currentHex) // sum of the current cost...
                + nextCost, // ...plus the cost of the neighbor move
              // List of the already visited hexes
              comeSoFarHexes = map.getIndexHexes(costSoFar),
              // Eventual current best cost for this neigbor
              costSoFarNext = map.getFromHex(costSoFar, next)

        // We can visit a location multiple times, with different costs
        if (
          HEXLIB.hexIndexOf(comeSoFarHexes, next) === -1 || // if neigbor not already visited...
          newCost < costSoFarNext // ...or neighbor cost is better than the eventual best previous path
        ) {
          // Replace or push the new best cost
          map.setFromHex(costSoFar, next, newCost)

          // Compute priority (lower = first)
          // Note: if no goal is provided, this boils down to the Dijkstra’s algorithm
          let priority = newCost
          // A-star heuristic: prioritize locations near the goal AND close to the start
          // See: https://www.redblobgames.com/pathfinding/a-star/introduction.html#astar
          if (goal) {
            priority += HEXLIB.hexDistance(next, goal)
          }
          // Add the neighbor to the frontier
          frontier.push(next, priority)

          // Replace or push the neighbor location
          map.setFromHex(cameFrom, next, currentHex)

          // Cost backup into map
          const nextCell = map.getCellFromHex(next)
          nextCell.cost = newCost
        }
      }
    }

    // BUILD PATH BACK FROM GOAL
    // We had a goal, and we reached it
    if (goal && found) {
      let currentHex = goal
      let path = [goal]

      // Did we came back to the start?
      while (!HEXLIB.hexEqual(currentHex, start)) {
        // If not, get the previous place...
        currentHex = map.getFromHex(cameFrom, currentHex)
        // and add it to our reverse path
        path.push(currentHex)
      }
      // Reverse the path (from goal->start to start->goal)
      return path.reverse()
    } else {
      // No path from start to goal has be found
      return undefined
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // MAP GENERATE
  // Re-generate map datas
  map.generate = () => {
    map.populate()
    map.createMap()
    map.generateGraph()
  }

  return map
}
