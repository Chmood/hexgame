import CONFIG_UNITS from './game-units'
import CONFIG_BUILDINGS from './game-buildings'

const CONFIG_GAME = {

  seed: 'staticgameseed', // undefined for a random seed
  playerStartingZoneRatio: 2, // portion of the map dedicated to player's units initial placement
  moneyEarnedPerBuilding: 1000,
  animationsSpeed: 2,
  throttleKeyboardTime: 128, // In milliseconds

  // Buildings
  buildings: CONFIG_BUILDINGS,

  // Units
  units: CONFIG_UNITS
}

export default CONFIG_GAME