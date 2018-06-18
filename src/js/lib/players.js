import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'
import Player from './player'

////////////////////////////////////////////////////////////////////////////////
// PLAYERS

const Players = (PLAYERS, map) => {
  const players = []

  const startingZoneRatio = CONFIG.game.playerStartingZoneRatio,
        occupiedhexes = [] // Hexes already taken by units

  for (const p of PLAYERS) {
    const playerId = p.id

    let player = Player({
      id: playerId,
      color: PLAYERS[playerId].color,
      name: PLAYERS[playerId].name,
      movement: PLAYERS[playerId].movement
    }, map, 2)

    for (const unit of player.units) {

      // UNIT RANDOM POSITION
      let isValidPosition = false
      while (!isValidPosition) {

        let col, row
        const randomCol = Math.random(),
          randomRow = Math.random(),
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
    
        // Check if the unit position is a valid cell
        const isValidBiome = map.isValidBiome(map.getCellFromHex(unit.hex).biome)

        // Check if the unit position is not already occupied by another unit
        let isFreeHex = true
        for (const hex of occupiedhexes) {
          if (HEXLIB.hexEqual(hex, unit.hex)) {
            isFreeHex = false
            break
          }
        }

        isValidPosition = isValidBiome && isFreeHex
      }
      occupiedhexes.push(unit.hex)
    }

    players.push(player)
  }

  return players
}

export default Players