////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (color) => {
  const player = {}

  player.color = color

  player.moveToHex = (hex, mapTopped, mapParity) => {
    player.hex = hex
    player.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return player
}

export default Player