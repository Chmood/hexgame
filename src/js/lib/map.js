import CONFIG from './config.js';
import HEXLIB from '../vendor/hexlib.js'
import seedrandom from 'seedrandom'

import PriorityQueue from '../vendor/priority-queue'
import noise from '../vendor/noise.js'
import MapBuildings from './map-buildings'

////////////////////////////////////////////////////////////////////////////////
// MAP

export default Map = (config) => { // WTF is this syntax only working here?! (bottom export elsewhere)
  const map = {

    ////////////////////////////////////////
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
    //   cost,      // Number - CURRENT pathfinding move cost from origin
    //   neighbors, // [type][Hex] - array of VALID neighbors' hexes (one for each unit type + shooting range)
    //   costs,     // [type][Number] - array of VALID neighbors' move costs (one for each unit type + shooting range)
    //
    //   tile       // BABYLON.Mesh - reference to the tile mesh
    // }

    ////////////////////////////////////////
    // PUBLIC ATTRIBUTES AND METHODS

    data: {
      terrain: [],
      buildings : []
    },

    // GENERATE MAP
    generateMap() {
      // Map cells instanciation
      populateMap()

      // Procedural terrain generation
      createMapData('height', config.mapValueRange.height)
      createMapData('moisture', config.mapValueRange.moisture)
      createMapBiomes()
    },

    generateBuildings() {
      // Buildings
      map.clearBuildings()

      // Buildings generation can fail!
      const generateBuildingsSuccess = createdMapBuildings()

      generateGraphs(CONFIG.game.units)

      return generateBuildingsSuccess
    },

    clearBuildings() {
      for (let x = 0; x < config.mapSize.width; x++) {
        for (let y = 0; y < config.mapSize.height; y++) {
          map.data.terrain[x][y].building = undefined
        }
      }
    },

    // RANDOMIZE SEED
    // Random seed the noise generator
    randomizeSeed() {
      map.setSeed(RNG())
    },

    // SET SEED
    setSeed(seed) {
      console.log(`Map seed set to "${seed}"`)
      mapSeed = seed
      RNG = seedrandom(mapSeed)
      noise.seed(mapSeed)
    },

    // GET CELL FROM HEX
    // Returns a map cell from a given (cubic) hex
    getCellFromHex(hex) {
      const hexOffset = HEXLIB.hex2Offset(hex, config.mapTopped, config.mapParity)
      if (map.data.terrain[hexOffset.col]) {
        if (map.data.terrain[hexOffset.col][hexOffset.row]) {
          return map.data.terrain[hexOffset.col][hexOffset.row]
        } else {
          // console.warn(`Map.getCellFromHex(): unknown row ${hexOffset.row}`)
          return undefined
        }
      } else {
        // console.warn(`Map.getCellFromHex(): unknown column ${hexOffset.col}`)
        return undefined
      }
    },

    // IS HEX ON MAP
    // Is the hex within the map boundaries?
    isHexOnMap(hex) {
      const hexOffset = HEXLIB.hex2Offset(hex, config.mapTopped, config.mapParity)

      return (hexOffset.col >= 0 &&
        hexOffset.row >= 0 &&
        hexOffset.col < config.mapSize.width &&
        hexOffset.row < config.mapSize.height)
    },

    // IS OCEAN BIOME
    isOceanCell(cell) {
      return (cell.biome === 'deepsea' || cell.biome === 'sea' || cell.biome === 'shore')
    },

    // IS VALID BIOME
    // Tells if the cell's biome is part of the graph
    isValidBiome(biome, allowedBiomes) {
      // The biomes we can't move on
      return allowedBiomes.indexOf(biome) !== -1
      // return (biome !== 'deepsea' && biome !== 'sea' && biome !== 'shore')
    },

    // FIND PATH
    // Find a path between 2 hexes, using a A-star algorithm
    // From: 
    //	http://www.redblobgames.com/pathfinding/a-star/introduction.html
    //	http://www.redblobgames.com/pathfinding/a-star/implementation.html
    findPath(graphType, start, goal, earlyExit = true, blacklist, costLimit = 1000000) {

      // if (!map.getCellFromHex(start).isInGraph[type]) console.warn('A*: start hex is NOT in graph!')
      // if (!map.getCellFromHex(goal).isInGraph[type]) console.warn('A*: goal hex is NOT in graph!')

      resetCosts()

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
        const neighbors = currentCell.neighbors[graphType]
        const neighborsCosts = currentCell.costs[graphType]

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
                  getFromHex(costSoFar, currentHex) // sum of the current cost...
                  + nextCost // ...plus the cost of the neighbor move

          // Skip this location if its cost exceed cost limit
          if (newCost > costLimit) {
            continue
          }

                // List of the already visited hexes
          const comeSoFarHexes = getIndexHexes(costSoFar),
                // Eventual current best cost for this neigbor
                costSoFarNext = getFromHex(costSoFar, next)

          // We can visit a location multiple times, with different costs
          if (
            HEXLIB.hexIndexOf(comeSoFarHexes, next) === -1 || // if neigbor not already visited...
            newCost < costSoFarNext // ...or neighbor cost is better than the eventual best previous path
          ) {
            // Replace or push the new best cost
            setFromHex(costSoFar, next, newCost)

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
            setFromHex(cameFrom, next, currentHex)

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
          currentHex = getFromHex(cameFrom, currentHex)
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
  }

  ////////////////////////////////////////
  // PRIVATE
  // RNG & seed
  let mapSeed, RNG

  // ARRAY 2D
  // Create an empty 2D array with given width and height
  const array2d = (width, height) => Array(...Array(width)).map(() => Array(height))

  // MAP POPULATE
  // Fill the 2d array with empty objects
  const populateMap = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map.data.terrain[x][y] = {}
      }
    }
  }

  // NORMALIZE NOISE
  const normalizeNoise = (val) => val / 2 + 0.5 // From [-1 1] to [0 1]

  // MAP GET RANGE
  const mapGetRange = (type) => {
    let minValue = 10000
    let maxValue = -10000

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const value = map.data.terrain[x][y][type]
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
  const mapLogRange = (type) => {
    const range = mapGetRange(type)
    console.log('MAP RANGE', type, 'min', range.min, 'max', range.max)
  }

  // MAP NORMALIZE
  const normalizeMap = (type, targetRange) => {
    const range = mapGetRange(type)

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const ratio = (map.data.terrain[x][y][type] - range.min) / (range.max - range.min)
        const newHeight = ratio * (targetRange - 0.00001)
        map.data.terrain[x][y][type] = newHeight
      }
    }
  }

  // MAKE ISLAND
  const makeIsland = (type) => {
    const halfWidth = Math.floor(config.mapSize.width / 2),
          halfHeight = Math.floor(config.mapSize.height / 2),

          offsetCenter = HEXLIB.hexOffset(halfWidth, halfHeight),
          offsetVertical = HEXLIB.hexOffset(halfWidth, 0),
          offsetHorizontal = HEXLIB.hexOffset(0, halfHeight),

          hexCenter = HEXLIB.offset2Hex(offsetCenter, config.mapTopped, config.mapParity),
          hexVertical = HEXLIB.offset2Hex(offsetVertical, config.mapTopped, config.mapParity),
          hexHorizontal = HEXLIB.offset2Hex(offsetHorizontal, config.mapTopped, config.mapParity),

          distanceMaxVertical = HEXLIB.hexDistance(hexCenter, hexVertical),
          distanceMaxHorizontal = HEXLIB.hexDistance(hexCenter, hexHorizontal),
          distanceMax = Math.min(distanceMaxVertical, distanceMaxHorizontal) - 
            config.mapPostprocess.height.islandMargin // Make sure map border are ocean

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
        map.data.terrain[x][y][type] *= ratio
      }
    }
  }

  // GET BIOME
  const getBiome = (height, moisture) => {

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
  const createMapBiomes = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map.data.terrain[x][y].biome = getBiome(map.data.terrain[x][y].height, map.data.terrain[x][y].moisture)
      }
    }
  }

  // CREATE NOISE
  const createNoise = (type, x, y) => {
    const nz = [] // noize
    let value = 0;

    for (let h = 0; h < config.mapNoise[type].harmonics.length; h++) {
      const frequencyDivider =
        config.mapNoise[type].frequency /
        Math.pow(2, h)

    nz[h] = normalizeNoise(
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

  // CREATE MAP DATA
  const createMapData = (type, range) => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {

        let value = 0 // From 0 to 1

        if (config.mapNoise[type].stupidRandom) {
          // Stupid random value
          value = RNG()
        } else {
          // Noise based value
          value = createNoise(type, x, y)
        }
        map.data.terrain[x][y][type] = value * range
      }
    }

    // Island mode
    if (config.mapPostprocess[type].islandMode) {
      makeIsland(type)
    }

    // Normalizing values
    if (config.mapPostprocess[type].normalize) {
      normalizeMap(type, config.mapValueRange[type])
    }
  }

  // CREATE MAP BUILDINGS
  const createdMapBuildings = () => {
    map.data.buildings = MapBuildings(map, RNG)

    return map.data.buildings
  }

  // IS VALID BUILDING
  const isValidBuilding = (buildingType, allowedBuildings) => {
    return allowedBuildings.indexOf(buildingType) !== -1
  }

  // IS VALID CELL
  // Tells if the cell is part of the graph or not
  const isValidCell = (cell, allowedBiomes, allowedBuildings) => {
    // Check if there a building on this cell
    if (cell.building) {
      // Is the building is valid? (whichever biome is below)
      return isValidBuilding(cell.building.type, allowedBuildings)
    }
    // Otherwise check the biome
    return map.isValidBiome(cell.biome, allowedBiomes)
  }

  // GET MOVE COST
  const getMoveCost = (toBiome, biomesMoveCosts, toBuilding, buildingsMoveCosts, fromHeight, toHeight) => {
    if (toBuilding) {
      if (!buildingsMoveCosts[toBuilding.type]) {
        console.error(`getMoveCost(): can't find building ${toBuilding.type} in buildingsMoveCosts!`)  
        return 1000000
      } else {
        return buildingsMoveCosts[toBuilding.type]
      }
    }

    if (!biomesMoveCosts[toBiome]) {
      console.error(`getMoveCost(): can't find biome ${toBiome} in biomesMoveCosts!`)
      return 1000000
    } else {
      return biomesMoveCosts[toBiome]
    }
  }

  // GENERATE GRAPH
  // Build the pathfinding graph, into the map
  const generateGraphs = (units) => {

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {

        const hexOffset = HEXLIB.hexOffset(x, y),
              hex = HEXLIB.offset2Hex(hexOffset, config.mapTopped, config.mapParity),
              cell = map.data.terrain[x][y], // Reference to the cell map data
              neighborsAll = HEXLIB.hexNeighbors(hex)

        cell.neighbors = []
        cell.costs = []
        cell.isInGraph = []

        // Loop on all unit types + the 'attack' special type
        const unitsKeys = Object.keys(units)
        unitsKeys.push('attack')

        for (const unitKey of unitsKeys) {
          const neighbors = [], // VALID neighbors of the cell
                costs = [] // Move costs to VALID neighbors

          let isInGraph

          if (unitKey === 'attack') {
            // 'attack' graph is special: never mind the biome, cost is always 1
            isInGraph = true // All cells are in the attack graph
            for (const neighbor of neighborsAll) {
              if (map.isHexOnMap(neighbor)) {
                costs.push(1)	// All attack 'movement' cost is 1
                // ADD EGDE
                neighbors.push(neighbor)
              }
            }
          } else {
            // Otherwise we build graph for the unit type, 
            // depending on biomes/buildings and their costs
            const biomesMoveCosts = units[unitKey].biomesMoveCosts,
                  allowedBiomes = Object.keys(biomesMoveCosts),
                  buildingsMoveCosts = units[unitKey].buildingsMoveCosts,
                  allowedBuildings = Object.keys(buildingsMoveCosts),

            // Add the cell to graph if valid
            isInGraph = isValidCell(cell, allowedBiomes, allowedBuildings)
    
            if (isInGraph) {
              // Each (eventual) neighbor of the cell
              for (const neighbor of neighborsAll) {
                // Is the neighbor on/in the map?
                if (map.isHexOnMap(neighbor)) {
                  // Get the neigbor cell
                  const neighborCell = map.getCellFromHex(neighbor)
    
                  // Is the neighbor a valid move?
                  if (isValidCell(neighborCell, allowedBiomes, allowedBuildings)) {
                    // Compute the cost to move to this neighbor
                    const cost = getMoveCost(
                      neighborCell.biome,
                      biomesMoveCosts,
                      neighborCell.building,
                      buildingsMoveCosts,
                      cell.height,
                      neighborCell.height
                    )

                    costs.push(cost)	// add the edge cost to the graph
                    // ADD EGDE
                    neighbors.push(neighbor)
                  }
                }
              }
            }
          }
          // Backup neighbors, costs and 'isInGraph' for this unit type into cell
          cell.neighbors[unitKey] = neighbors
          cell.costs[unitKey] = costs
          cell.isInGraph[unitKey] = isInGraph
        }
        // Backup hex and hex offset into cell
        cell.hex = hex
        cell.hexOffset = hexOffset
      }
    }
  }

  // GET FROM HEX
  // Return a value from an hex index
  // As we have no string hex notation, we use hex objects as 'indexes'
  // in a data 2d array: [hex][value]
  const getFromHex = (data, hex) => {
    for (const d of data) {
      if (HEXLIB.hexEqual(d[0], hex)) {
        return d[1]
      }
    }
    return undefined
  }

  // SET FROM HEX
  // Replace or add a value from an hex index in a data 2d array: [hex][value]
  const setFromHex = (data, hex, value) => {
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
  // Same principle as getFromHex(), see above
  const getIndexHexes = (data) => {
    const hexes = []
    for (const d of data) {
      hexes.push(d[0])
    }  
    return hexes
  }  

  // RESET COSTS
  // Reset all move costs to max value
  const resetCosts = () => {
    for (let y = 0; y < config.mapSize.height; y++) {
      for (let x = 0; x < config.mapSize.width; x++) {
        map.data.terrain[x][y].cost = 100000000
      }
    }
  }

  map.data.terrain = array2d(config.mapSize.width, config.mapSize.height)

  return map
}
