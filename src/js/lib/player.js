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

  // UNITS
  player.units = []
  for (let n = 0; n < 5; n++) {
    const unit = Unit({
      id: n,
      playerId: player.id,
      type: 'tank',
      color: player.color
    })

    player.units.push(unit)
  }

  return player
}

export default Player