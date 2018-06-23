import ShadeBlend from '../vendor/shadeblend'
import Unit from './unit'

////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (config) => {
  const player = {}

  // BASE
  player.id = config.id
  player.name = config.name
  player.isHuman = config.isHuman
  player.color = config.color
  // player.colorDesaturated = ShadeBlend(0.5, player.color, '#888888')

  const setUnitRandomType = () => {
    const rng = Math.random()

    if (rng > 0.66) {
      return 'tank'
    } else if (rng > 0.33) {
      return 'jeep'
    } else {
      return 'boat'
    }
  }

  // UNITS
  player.units = []
  for (let n = 0; n < 7; n++) {
    const unit = Unit({
      id: n,
      playerId: player.id,
      type: setUnitRandomType(),
      color: player.color
    })

    player.units.push(unit)
  }

  return player
}

export default Player