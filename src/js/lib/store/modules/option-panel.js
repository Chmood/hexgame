import CONFIG_RENDER_3D from '../../../config/render3d'
import MaterialColors from '../../../vendor/material-colors'

// TODO

// initial state
const state = {
  isActive: false,
  
  options: CONFIG_RENDER_3D,
  // postprocess,
  // realistic
}

state.options.fullscreen = false

// getters
const getters = {
  getOptions: (state) => state.options
}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },

  updateOptionFullscreen (state, { fullscreen }) {
    state.options.fullscreen = fullscreen
  },

  updateOptionBetterOcean (state, { betterOcean }) {
    state.options.betterOcean = betterOcean
  }
}

export default {
  namespaced: true,
  state,
  getters,
  // actions,
  mutations
}