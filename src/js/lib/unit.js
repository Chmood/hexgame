import HEXLIB from '../vendor/hexlib.js'

////////////////////////////////////////////////////////////////////////////////
// UNIT

const Unit = (config) => {
  const unit = {}

  unit.playerId = config.playerId
  unit.name = config.name
  unit.color = config.color
  unit.movement = config.movement

  unit.moveToHex = (hex, mapTopped, mapParity) => {
    unit.hex = hex
    unit.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return unit
}

export default Unit