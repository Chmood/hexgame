import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// UNIT

// Computed stats
// See: http://fireemblem.wikia.com/wiki/Battle_Formulas
// attackSpeed,
// repeatedAttack,
// hitRate,
// avoid,
// accuracy,
// attackPower,
// defensePowerPhysical,
// defensePowerMagical,
// damage,
// criticalDamage,
// criticalRate,
// criticalEvade,
// criticalChance

const Unit = (config) => {
  const unit = Object.assign(
    {},
    CONFIG.game.units[config.type],
    {
      id: config.id,
      playerId: config.playerId,
      type: config.type,
      color: config.color,
      name: `${config.type}-${config.id}`,
      hasPlayed: false,
      health: CONFIG.game.units[config.type].maxHealth - 3
    }
  )

  unit.moveToHex = (hex, mapTopped, mapParity) => {
    unit.hex = hex
    unit.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return unit
}

export default Unit