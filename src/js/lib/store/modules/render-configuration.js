import CONFIG_RENDER_3D from '../config/render3d'
import MaterialColors from '../../../vendor/material-colors'

// TODO

// initial state
const state = {
  isActive: false,
  
  config: CONFIG_RENDER_3D,

  fullscreen: false,
  postprocess,
  realistic
}

// getters
const getters = {
  getRenderConfig: (state) => state
}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },
  
}

export default {
  namespaced: true,
  state,
  getters,
  // actions,
  mutations
}