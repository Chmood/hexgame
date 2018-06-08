import HEXLIB from '../vendor/hexlib.js'
import PriorityQueue from './priority-queue.js'
import noise from '../vendor/noise.js'

////////////////////////////////////////////////////////////////////////////////
// MAP

export default Map = (config) => { // WTF is this syntax only working here?! (bottom export elsewhere)

  // ARRAY 2D
  const array2d = (x, y) => Array(...Array(x)).map(() => Array(y))

  // WEIRD: map is an 2d array WITH methods - TODO better (or not?)
  const map = array2d(config.mapSize.width, config.mapSize.height)
  
  // Backup configuration
  map.config = config

  // RANDOMIZE SEED
  // Random seed the noise generator
  map.randomizeSeed = () => {
    map.setSeed(Math.random())
  }

  // SET SEED
  map.setSeed = (seed) => {
    config.mapSeed = seed
    noise.seed(config.mapSeed)
  }

  // GET FROM HEX
  // Returns a map cell from a given (cubic) hex
  map.getFromHex = (hex) => {
    const hexOffset = HEXLIB.hex2Offset(hex, config.mapTopped, config.mapParity)
    if (map[hexOffset.col]) {
      if (map[hexOffset.col][hexOffset.row]) {
        return map[hexOffset.col][hexOffset.row]
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }

  // MAP POPULATE
  // Fill the 2d array with empty objects
  map.populate = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map[x][y] = {}
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
        const value = map[x][y][type]
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
        const ratio = (map[x][y][type] - range.min) / (range.max - range.min)
        const newHeight = ratio * (targetRange - 0.00001)
        map[x][y][type] = newHeight
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

    const distanceMaxVertical = HEXLIB.hexDistance(
      hexCenter,
      hexVertical
    )
    const distanceMaxHorizontal = HEXLIB.hexDistance(
      hexCenter,
      hexHorizontal
    )
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
          ratio += (Math.random() / 5)
        }
        map[x][y][type] *= ratio
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
        map[x][y].biome = map.getBiome(map[x][y].height, map[x][y].moisture)
      }
    }
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

        // Stupid random value
        if (config.mapNoise[type].stupidRandom) {
          value = Math.random()

          // Noise based value
        } else {
          const nz = [] // noize
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
        }
        map[x][y][type] = value * range
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

    // 		// Make map values as integers
    // 		map.roundMapHeight(dataMap)
  }

  // IS VALID CELL
  // Tells if the cell is part of the graph or not, depending on its biome
  map.isValidCell = (biome) => {
    // The biomes we can't move on
    return (biome !== 'deepsea' && biome !== 'sea' && biome !== 'shore')
  }

  // GET MOVE COST
  map.getMoveCost = (fromHeight, toHeight, toBiome) => {
    let cost = 10000,
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
          neighbors = [],
          costs = [],
          // height = map[x][y].height, // Not in use for now
          biome = map[x][y].biome,
          height = map[x][y].height

        // Add the cell to graph if the height is valid
        map[x][y].isInGraph = map.isValidCell(biome)

        if (map[x][y].isInGraph) {

          // Each (eventual) neighbor of the cell
          for (let i = 0; i < 6; i++) {
            const n = neighborsAll[i],
              no = HEXLIB.hex2Offset(n, config.mapTopped, config.mapParity)

            // Is the neighbor on/in the map?
            if (no.col >= 0 &&
              no.row >= 0 &&
              no.col < config.mapSize.width &&
              no.row < config.mapSize.height) {

              // Is the neighbor a valid move?
              const neighborHeight = map[no.col][no.row].height,
                neighborBiome = map[no.col][no.row].biome

              if (map.isValidCell(neighborBiome)) {
                const cost = map.getMoveCost(height, neighborHeight, neighborBiome)
                // cost = Math.floor(cost)
                costs.push(cost)	// add the edge cost to the graph

                // ADD EGDE
                neighbors.push(n)
              }
            }
          }
        }

        // Backup things into cell
        map[x][y].hex = hex
        map[x][y].hexOffset = hexOffset
        map[x][y].neighbors = neighbors
        map[x][y].costs = costs
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // PATH FINDING

  // As we have no string hex notation, we use hex objects as 'indexes'
  // in a 2d array: [hex][value]

  // GET INDEX HEXES
  // Return an array of hexes from an array with theses hexes as indexes
  map.getIndexHexes = (cameFrom) => {
    const hexes = []
    for (let h = 0; h < cameFrom.length; h++) {
      hexes.push(cameFrom[h][0])
    }
    return hexes
  }

  // FIND FROM HEX
  // Return a value from an hex index
  map.findFromHex = (data, hex) => {
    for (let h = 0; h < data.length; h++) {
      if (HEXLIB.hexEqual(data[h][0], hex)) {
        return data[h][1]
      }
    }
    return undefined
  }

  // A-STAR PATHFINDING
  // Find a path between 2 hexes
  // From: 
  //	http://www.redblobgames.com/pathfinding/a-star/introduction.html
  //	http://www.redblobgames.com/pathfinding/a-star/implementation.html
  map.findPath = (start, goal, earlyExit = true) => {

    // if (!map.getFromHex(start).isInGraph) console.warn('A*: start hex is NOT in graph!')
    // if (!map.getFromHex(goal).isInGraph) console.warn('A*: goal hex is NOT in graph!')

    for (let y = 0; y < config.mapSize.height; y++) {
      for (let x = 0; x < config.mapSize.width; x++) {
        map[x][y].cost = 100000000
      }
    }

    const frontier = PriorityQueue() // List of the places still to explore
    const cameFrom = [] // List of where we've already been
    const costSoFar = []	// The price we paid to go there
    let found = false

    frontier.push(start, 0)
    cameFrom.push([start, undefined])
    costSoFar.push([start, 0])

    // LOOP
    while (frontier.length() > 0) {

      const current = frontier.pop()
      const currentHex = map.getFromHex(current)
      // if (!currentHex.isInGraph) console.error('A*: current hex is NOT in graph!')

      // const	neighbors = arrayShuffle(currentHex.neighbors)	// cheapo edge breaks
      const neighbors = currentHex.neighbors
      const costs = currentHex.costs

      if (goal) {
        if (HEXLIB.hexEqual(current, goal)) {
          found = true
          // Early exit (stop exploring map when goal is reached)
          if (earlyExit) break
        }
      }

      for (let n = 0; n < neighbors.length; n++) {
        if (!map.getFromHex(neighbors[n]).isInGraph) console.error('argl!')

        const next = neighbors[n],
          nextCost = costs[n],
          newCost = map.findFromHex(costSoFar, current) // sum of the current cost...
            + nextCost, // ...plus the cost of the next move
          // cameFromHexes = map.getIndexHexes(cameFrom), // Not in use for now
          comeSoFarHexes = map.getIndexHexes(costSoFar)

        if (!HEXLIB.hexIndexOf(comeSoFarHexes, next) || newCost < costSoFar[next]) {
          costSoFar.push([next, newCost])
          const priority = newCost + HEXLIB.hexDistance(next, goal) // heuristic
          frontier.push(next, priority)
          cameFrom.push([next, current])

          // Cost backup
          const nextOffset = HEXLIB.hex2Offset(next)
          map[nextOffset.col][nextOffset.row].cost = Math.floor(newCost)
        }
      }
    }

    // BUILD PATH BACK FROM GOAL

    if (goal && found) {
      let current = goal
      let path = [goal]

      while (!HEXLIB.hexEqual(current, start)) {
        current = map.findFromHex(cameFrom, current)
        path.push(current)
      }

      return path.reverse()
    } else {
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
