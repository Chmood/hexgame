import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'
import Player from './player'

////////////////////////////////////////////////////////////////////////////////
// PLAYERS

const Players = (PLAYERS, map, RNG) => {
  const players = []

  const startingZoneRatio = CONFIG.game.playerStartingZoneRatio,
        occupiedhexes = [] // Hexes already taken by units

  // SET UNIT RANDOM POSITION
  const setUnitRandomPosition = (unit, playerId) => {
    let isValidPosition = false

    while (!isValidPosition) {
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

      // Check if the unit can move to ALL other units 
      let isConnectedToOthers = true
      // for (const otherHex of occupiedhexes) {
      //   const path = map.findPath(unit.type, unit.hex, otherHex) // unit.type will do shit here!
      //   if (path === undefined) {
      //     isConnectedToOthers = false
      //     break
      //   }
      // }

      isValidPosition = isValidBiome && isFreeHex && isConnectedToOthers
    }
    occupiedhexes.push(unit.hex)
  }

  for (const p of PLAYERS) {
    const playerId = p.id

    let player = Player({
      id: playerId,
      name: PLAYERS[playerId].name,
      isHuman: PLAYERS[playerId].isHuman,
      color: PLAYERS[playerId].color
    })

    for (const unit of player.units) {
      setUnitRandomPosition(unit, playerId)
    }

    players.push(player)
  }

  return players
}

export default Players