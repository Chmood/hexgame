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
    const rng = Math.random()

    if (rng > 0.75) {
      return 'tank'
    } else if (rng > 0.5) {
      return 'jeep'
    } else if (rng > 0.25) {
      return 'bazooka'
    } else {
      return 'boat'
    }
  }

  // UNITS
  for (let n = 0; n < 7; n++) {
    player.addUnit(setUnitRandomType())
  }

  return player
}

export default Player