import CONFIG_GAME from '../../../config/game'
import CONFIG_MAP from '../../../config/map'
import CONFIG_PLAYERS from '../../../config/players'

import MaterialColors from '../../../vendor/material-colors'

// initial state
const state = {
  isActive: false,
  currentGameConfigurationStep: 0,

  config: {
    game: JSON.parse(JSON.stringify(CONFIG_GAME)),
    players: JSON.parse(JSON.stringify(CONFIG_PLAYERS)),
    map: JSON.parse(JSON.stringify(CONFIG_MAP))
  },

  isReady: {
    players: true,
    terrain: true,
    buildings: true,
    units: true
  },

  colors: MaterialColors
}

// STATE HELPERS

const setPlayersId = (state) => {
  let playerId = 0

  for (const player of state.config.players) {
    player.id = playerId
    playerId++
  }
}

const getRandomColor = () => {
  const colorKeys = Object.keys(state.colors)

  // INFINITE LOOP RISK: we suppose there always are free colors
  // Lot more colors than maximum players
  let success = false

  while (!success) {
    const colorId = Math.floor(Math.random() * colorKeys.length),
          key = colorKeys[colorId],
          color = state.colors[key]

    if (color) {
      if (!color.isUsed) {
        success = true
        color.isUsed = true
  
        return { color, name: key }
      }
    }
  }
}

const freeColor = (color) => {
  color.color.isUsed = false
}

const setPlayerRandomColor = (player) => {
  const randomColor = getRandomColor()

  if (!player) console.error('no player provided')

  // Free current color if any
  if (player.colors) {
    freeColor(player.colors)
  }

  player.color = randomColor.color[500],
  player.colorDesaturated = randomColor.color[900]
  player.colors = randomColor
}

// INIT COMPUTED VARIABLES

// Players
setPlayersId(state)

// Set random colors to CONFIG players
for (const player of state.config.players) {
  setPlayerRandomColor(player)
}

// Map
state.config.map.mapNoise.height.frequency =
  state.config.map.mapNoise.height.frequencyRatio * state.config.map.mapSize.width
state.config.map.mapNoise.moisture.frequency =
  state.config.map.mapNoise.moisture.frequencyRatio * state.config.map.mapSize.width

// getters
const getters = {
  getGameConfig: (state) => state.config,
  getColors: (state) => state.colors
}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },

  changeStep (state, { increment }) {
    let currentGameConfigurationStep = state.currentGameConfigurationStep + increment

    if (currentGameConfigurationStep < 0) {
      currentGameConfigurationStep = 0
    } else if (currentGameConfigurationStep >= 5) {
      currentGameConfigurationStep = 4
    }

    if (currentGameConfigurationStep !== state.currentGameConfigurationStep) {
      state.currentGameConfigurationStep = currentGameConfigurationStep
    }
  },

  setReady (state, { step, isReady }) {
    state.isReady[step] = isReady
  },

  createPlayer (state, { player }) {
    const randomColor = getRandomColor()

    state.config.players.push({
      name: 'New player', 
      isHuman: false, 
      color: randomColor.color[500], 
      colorDesaturated: randomColor.color[900],
      colors: randomColor,
      money: 5000,
      moneyPerBuilding: 1000
    })

    setPlayersId(state)
  },
  deletePlayer (state, { player }) {
    const id = state.config.players.indexOf(player)
    if (id !== -1) {
      state.config.players.splice(id, 1)

      // Free color
      freeColor(player.colors)

      setPlayersId(state)
    }
  },
  updatePlayerColor (state, { player }) {
    setPlayerRandomColor(player)
  },
  updatePlayerName (state, { player, name }) {
    player.name = name
  },
  updatePlayerType (state, { player, isHuman }) {
    player.isHuman = isHuman
  },
  updatePlayerMoney (state, { player, money }) {
    player.money = money
  },
  updatePlayerMoneyPerBuilding (state, { player, money }) {
    player.moneyPerBuilding = money
  },

  updateMapSize (state, { width, height }) {
    state.config.map.mapSize = { width, height }
  },
  updateMapTopping (state, { topped }) {
    state.config.map.mapTopped = topped
  },
  updateMapNoiseFrequencyRatio (state, { ratio, type }) {
    if (type === 'elevation') {
      type = 'height'
    }
    state.config.map.mapNoise[type].frequencyRatio = ratio
    state.config.map.mapNoise[type].frequency =
      state.config.map.mapNoise[type].frequencyRatio * state.config.map.mapSize.width
  },
  updateMapNoiseHarmonics (state, { level, harmonicId, type }) {
    if (type === 'elevation') {
      type = 'height'
    }
    const otherId = harmonicId === 1 ? 2 : 1,
          tonicLevel = state.config.map.mapNoise[type].harmonics[0],
          harmonicLevel = state.config.map.mapNoise[type].harmonics[harmonicId],
          otherLevel = state.config.map.mapNoise[type].harmonics[otherId],
          harmonicDelta = level - harmonicLevel

    // One is zero
    if (tonicLevel === 0 && otherLevel === 0) {
      state.config.map.mapNoise[type].harmonics[0] -= harmonicDelta / 2
      state.config.map.mapNoise[type].harmonics[otherId] -= harmonicDelta / 2

    } else if (tonicLevel === 0) {
      state.config.map.mapNoise[type].harmonics[otherId] -= harmonicDelta

    } else if (otherLevel === 0) {
      state.config.map.mapNoise[type].harmonics[0] -= harmonicDelta

    } else {
      // None is zero
      let othersRatio = tonicLevel / otherLevel,
          tonicShare, otherShare

      if (othersRatio > 1) {
        const totalShare = othersRatio + 1
        tonicShare = (othersRatio / totalShare) * harmonicDelta
        otherShare = (1 / totalShare) * harmonicDelta

      } else {
        othersRatio = 1 / othersRatio
        const totalShare = othersRatio + 1
        tonicShare = (1 / totalShare) * harmonicDelta
        otherShare = (othersRatio / totalShare) * harmonicDelta
      }

      state.config.map.mapNoise[type].harmonics[0] -= tonicShare
      state.config.map.mapNoise[type].harmonics[otherId] -= otherShare
    }

    state.config.map.mapNoise[type].harmonics[harmonicId] = level
  },
  updateMapPostprocessRedistributionPower (state, { power, type }) {
    if (type === 'elevation') {
      state.config.map.mapPostprocess.height.redistributionPower = power

    } else if (type === 'moisture') {
      state.config.map.mapPostprocess.moisture.redistributionPower = power
    }
  },
  updateMapPostprocessNormalize (state, { normalize, type }) {
    if (type === 'elevation') {
      state.config.map.mapPostprocess.height.normalize = normalize

    } else if (type === 'moisture') {
      state.config.map.mapPostprocess.moisture.normalize = normalize
    }
  },
  updateMapPostprocessIslandMode (state, { islandMode }) {
    state.config.map.mapPostprocess.height.islandMode = islandMode
  },
  updateMapPostprocessIslandRedistributionPower (state, { power }) {
    state.config.map.mapPostprocess.height.islandRedistributionPower = power
  },

  updateGameBuildingsNumber (state, { number, building, owned }) {
    if (owned) {
      building.numberOwned = number
      if (building.numberOwned > building.number) {
        building.numberOwned = building.number
      } else if (building.numberOwned < 0) {
        building.numberOwned = 0
      }
    } else {
      building.number = number
      if (building.number < building.numberOwned) {
        building.number = building.numberOwned
      }
    }
  },
  updateGameUnitsNumber (state, { number, unit }) {
    unit.number = number
    if (unit.number < 0) {
      unit.number = 0
    }
  },
  updateGameUnitsIsDisabled (state, { isDisabled, unit }) {
    unit.isDisabled = isDisabled
  },
  
}

export default {
  namespaced: true,
  state,
  getters,
  // actions,
  mutations
}