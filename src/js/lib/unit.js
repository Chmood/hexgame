import HEXLIB from '../vendor/hexlib.js'

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

const Unit = (CONFIG_GAME, config) => {
  const unit = Object.assign(
    {},
    CONFIG_GAME.units[config.type],
    {
      id: config.id,
      playerId: config.playerId,
      type: config.type,
      color: config.color,
      name: `${config.type}-${config.id}`,
      hasPlayed: false,
      hasMoved: false,
      health: CONFIG_GAME.units[config.type].maxHealth
    }
  )

  unit.moveToHex = (hex, mapTopped, mapParity) => {
    unit.hex = hex
    unit.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return unit
}

export default Unit