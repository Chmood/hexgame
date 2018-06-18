import Unit from './unit'

////////////////////////////////////////////////////////////////////////////////
// PLAYER

const Player = (config) => {
  const player = {}

  // BASE
  player.id = config.id
  player.name = config.name
  player.color = config.color

  // UNITS
  player.units = []
  for (let n = 0; n < 5; n++) {
    const unit = Unit({
      id: n,
      playerId: config.id,
      name: `Player-${config.id}-tank-${n}`,
      color: config.color,
      movement: config.movement
    })

    player.units.push(unit)
  }

  return player
}

export default Player