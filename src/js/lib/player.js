import HEXLIB from '../vendor/hexlib.js'
import ShadeBlend from '../vendor/shadeblend'
import Unit from './unit'

////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (CONFIG_MAP, CONFIG_GAME, config) => {

  const player = {
    id: config.id,
    name: config.name,
    isHuman: config.isHuman,
    money: config.money,
    color: config.color,
    // colorDesaturated: ShadeBlend(0.5, player.color, '#888888'),

    hasLost: false,
    hasPlayed: false,
    units: [],
  
    // ADD UNIT
    addUnit(unitType, position = HEXLIB.hex(-1, -1)) {
      const unit = Unit(
        CONFIG_GAME,
        {
          id: findFreeUnitId(),
          playerId: player.id,
          type: unitType,
          color: player.color
        }
      )

      unit.moveToHex(position, CONFIG_MAP.mapTopped, CONFIG_MAP.mapParity)
  
      player.units.push(unit)

      return unit
    }
  }

  // FIND UNIT BY ID
  const findUnitById = (id) => {
    for (const unit of player.units) {
      if (unit.id === id) {
        return unit
      }
    }

    return false
  }

  // FIND FREE UNIT ID
  const findFreeUnitId = () => {
    let id = 0

    while(findUnitById(id) !== false) {
      id++
    }

    return id
  }

  // SET UNIT RANDOM TYPE
  const setUnitRandomType = (types = Object.keys(CONFIG_GAME.units)) => {
    const nTypes = types.length,
          rng = Math.floor(Math.random() * nTypes)

    return types[rng]
  }

  // UNITS
  Object.entries(CONFIG_GAME.units).forEach(([unitType, unit]) => {

    if (!unit.isDisabled) {
      for (let n = 0; n < unit.number; n++) {
        player.addUnit(unitType)    
      }
    }
  })

  // RANDOM UNITS
  // for (let n = 0; n < 5; n++) {
  //   // player.addUnit(setUnitRandomType()) // All types
  //   player.addUnit(setUnitRandomType([
  //     'soldier',
  //     'bazooka',
  //     'jeep',
  //     'artillery',
  //     'tank',
  //     // 'heavy-tank',
  //     'cruiser',
  //     'helicopter'
  //     // 'bomber'
  //   ])) // Selected types
  //   // player.addUnit('air-transport') // Single type
  // }

  return player
}

export default Player