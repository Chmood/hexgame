// initial state
const state = {
  isActive: false,
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}