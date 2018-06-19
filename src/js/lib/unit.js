import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// UNIT

const Unit = (config) => {
  const unit = Object.assign(
    {},
    CONFIG.game.units[config.type],
    {
      id: config.id,
      playerId: config.playerId,
      type: config.type,
      color: config.color,
      name: `${config.type}-${config.id}`
    }
  )

  unit.moveToHex = (hex, mapTopped, mapParity) => {
    unit.hex = hex
    unit.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return unit
}

export default Unit