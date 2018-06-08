import Player from './player.js'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// PLAYERS

const Players = (PLAYERS, mapTopped, mapParity, playerZoneRatio = 1) => {
  const players = []

  for (let p = 0; p < PLAYERS.length; p++) {
    let player = Player(PLAYERS[p].color)
    let col, row

    const randomCol = Math.random(),
      randomRow = Math.random(),
      colStart = Math.floor(CONFIG.map.mapSize.width * randomCol / playerZoneRatio),
      rowStart = Math.floor(CONFIG.map.mapSize.height * randomRow / playerZoneRatio),
      colEnd = Math.floor(CONFIG.map.mapSize.width * (1 - randomCol / playerZoneRatio)),
      rowEnd = Math.floor(CONFIG.map.mapSize.height * (1 - randomRow / playerZoneRatio))

    if (p === 0) { // bottom left
      col = colStart 
      row = rowEnd 
    } else if (p === 1) { // top right
      col = colEnd
      row = rowStart
    }

    player.hexOffset = HEXLIB.hexOffset(col, row)
    player.hex = HEXLIB.offset2Hex(player.hexOffset, mapTopped, mapParity)

    players.push(player)
  }

  return players
}

export default Players