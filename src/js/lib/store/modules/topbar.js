// initial state
const state = {
  isActive: false,
  player: {
    name: '',
    money: 0
  },
  mode: ''
}

// getters
const getters = {
}

// actions
const actions = {
}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },

  setPlayer (state, { player }) {
    state.player.name = player.name
    state.player.money = player.money
  },

  setMode (state, { mode }) {
    state.mode = mode
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}