import HEXLIB from '../vendor/hexlib.js'
import Player from './player'

////////////////////////////////////////////////////////////////////////////////
// CONFIG_PLAYERS

const Players = (CONFIG_MAP, CONFIG_GAME, CONFIG_PLAYERS, map, RNG) => {
  const players = []

  const startingZoneRatio = CONFIG_GAME.playerStartingZoneRatio,
        occupiedhexes = [], // Hexes already taken by units
        placedUnits = []

  // SET UNIT RANDOM POSITION
  const setUnitRandomPosition = (unit, playerId) => {
    let isValidPosition = false,
        nTryLeft = 10


    while (!isValidPosition) {
      nTryLeft--
      if (nTryLeft === 0) {
        return false
      }

      let col, row
      const randomCol = RNG(),
        randomRow = RNG(),
        colStart = Math.floor(CONFIG_MAP.mapSize.width * randomCol / startingZoneRatio),
        rowStart = Math.floor(CONFIG_MAP.mapSize.height * randomRow / startingZoneRatio),
        colEnd = Math.floor(CONFIG_MAP.mapSize.width * (1 - randomCol / startingZoneRatio)),
        rowEnd = Math.floor(CONFIG_MAP.mapSize.height * (1 - randomRow / startingZoneRatio))
  
      if (playerId === 0) {
        col = colStart // left
        row = rowEnd //bottom
      } else if (playerId === 1) {
        col = colEnd // right
        row = rowStart // top
      } else if (playerId === 2) {
        col = colEnd // right
        row = rowEnd // bottom
      } else if (playerId === 3) {
        col = colStart // left
        row = rowStart // top
      }
      
      unit.hexOffset = HEXLIB.hexOffset(col, row)
      unit.hex = HEXLIB.offset2Hex(unit.hexOffset, CONFIG_MAP.mapTopped, CONFIG_MAP.mapParity)
  
      // Check if the unit position is a valid biome cell
      const isValidBiome = map.isValidBiome(
        map.getCellFromHex(unit.hex).biome,
        Object.keys(unit.biomesMoveCosts)
      )

      // Check if the unit position is not already occupied by another unit
      let isFreeHex = true
      for (const hex of occupiedhexes) {
        if (HEXLIB.hexEqual(hex, unit.hex)) {
          isFreeHex = false
          break
        }
      }

      // Check if sea units can move to ALL other sea units
      let isConnectedToOthers = true
      for (const placedUnit of placedUnits) {
        if (unit.family === 'sea' && placedUnit.family === 'sea') {
          const path = map.findPath('cruiser', unit.hex, placedUnit.hex)
          if (path === undefined) {
            isConnectedToOthers = false
          }
        }
      }

      isValidPosition = isValidBiome && isFreeHex && isConnectedToOthers
    }
    occupiedhexes.push(unit.hex)
    placedUnits.push(unit)

    return true
  }

  let nUnitsPlaced = 0
  let currentId = 0

  for (const p of CONFIG_PLAYERS) {
    const playerId = currentId

    let player = Player(
      CONFIG_MAP, 
      CONFIG_GAME, 
      {
        id: playerId,
        name: CONFIG_PLAYERS[playerId].name,
        isHuman: CONFIG_PLAYERS[playerId].isHuman,
        color: CONFIG_PLAYERS[playerId].color
      }
    )

    for (const unit of player.units) {
      const isUnitPlaced = setUnitRandomPosition(unit, playerId)
      if (isUnitPlaced) {
        nUnitsPlaced++
      } else {
        console.log(`Units placed: ${nUnitsPlaced}`)
        console.log(`Unit #${nUnitsPlaced + 1} can't be placed!`)
        return false
      }
    }

    players.push(player)
    currentId++
  }

  return players
}

export default Players