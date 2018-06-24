import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'
import Player from './player'

////////////////////////////////////////////////////////////////////////////////
// PLAYERS

const Players = (PLAYERS, map, RNG) => {
  const players = []

  const startingZoneRatio = CONFIG.game.playerStartingZoneRatio,
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
        colStart = Math.floor(CONFIG.map.mapSize.width * randomCol / startingZoneRatio),
        rowStart = Math.floor(CONFIG.map.mapSize.height * randomRow / startingZoneRatio),
        colEnd = Math.floor(CONFIG.map.mapSize.width * (1 - randomCol / startingZoneRatio)),
        rowEnd = Math.floor(CONFIG.map.mapSize.height * (1 - randomRow / startingZoneRatio))
  
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
      unit.hex = HEXLIB.offset2Hex(unit.hexOffset, CONFIG.map.mapTopped, CONFIG.map.mapParity)
  
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

      // Check if boats can move to ALL other boats
      let isConnectedToOthers = true
      for (const placedUnit of placedUnits) {
        if (unit.type === 'boat' && placedUnit.type === 'boat') {
          const path = map.findPath('boat', unit.hex, placedUnit.hex)
          if (path === undefined) {
            isConnectedToOthers = false
          }
        // } else if ((unit.type === 'tank' || unit.type === 'jeep') && 
        //   (placedUnit.type === 'tank' || unit.type === 'jeep')) {
        //   const path = map.findPath('jeep', unit.hex, placedUnit.hex)
        //   if (path === undefined) {
        //     isConnectedToOthers = false
        //   }
        }
      }

      isValidPosition = isValidBiome && isFreeHex && isConnectedToOthers
    }
    occupiedhexes.push(unit.hex)
    placedUnits.push(unit)

    return true
  }

  let nUnitsPlaced = 0
  for (const p of PLAYERS) {
    const playerId = p.id

    let player = Player({
      id: playerId,
      name: PLAYERS[playerId].name,
      isHuman: PLAYERS[playerId].isHuman,
      color: PLAYERS[playerId].color
    })

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
  }

  return players
}

export default Players