import HEXLIB from '../vendor/hexlib.js'

////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (config) => {
  const player = {}

  player.name = config.name
  player.color = config.color
  player.movement = config.movement

  player.moveToHex = (hex, mapTopped, mapParity) => {
    player.hex = hex
    player.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return player
}

export default Player