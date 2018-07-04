import HEXLIB from '../vendor/hexlib.js'
import ShadeBlend from '../vendor/shadeblend'
import Unit from './unit'
import CONFIG from './config';

////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (config) => {

  const player = {
    id: config.id,
    name: config.name,
    isHuman: config.isHuman,
    hasLost: false,
    money: CONFIG.game.playerStartingMoney,
    color: config.color,
    // colorDesaturated: ShadeBlend(0.5, player.color, '#888888'),
    units: [],
  
    // ADD UNIT
    addUnit(unitType, position = HEXLIB.hex(-1, -1)) {
      const unit = Unit({
        id: findFreeUnitId(),
        playerId: player.id,
        type: unitType,
        color: player.color
      })

      unit.moveToHex(position, CONFIG.map.mapTopped, CONFIG.map.mapParity)
  
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
  const setUnitRandomType = () => {
    const types = Object.keys(CONFIG.game.units),
          nTypes = types.length,
          rng = Math.floor(Math.random() * nTypes)

    return types[rng]
  }

  // UNITS
  for (let n = 0; n < 7; n++) {
    // player.addUnit(setUnitRandomType())
    // player.addUnit('soldier')
  }

  return player
}

export default Player