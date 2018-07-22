// initial state
const state = {
  isActive: false,
  // player: {
  //   name: '',
  //   money: 0
  // },
  player: {
    name: '',
    money: 0,
    color: '#fff'
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
    // state.player = player

    // We want a deep copy
    state.player.name = player.name
    state.player.money = player.money
    state.player.color = player.color
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