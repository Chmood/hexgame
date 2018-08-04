// initial state
const state = {
  isActive: false,

  data: {
    cell: null,
    building: null,
    unit: null
  },

  dataAttacker: {
    cell: null,
    building: null,
    unit: null
  }
}

// getters
const getters = {}

// actions
const actions = {}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },

  setData (state, { cell, building, unit }) {
    state.data.cell = cell
    state.data.building = building
    state.data.unit = unit
  },

  setDataAttacker (state, { cell, building, unit }) {
    state.dataAttacker.cell = cell
    state.dataAttacker.building = building
    state.dataAttacker.unit = unit
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}