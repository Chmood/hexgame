import CONFIG from '../../config'
import MaterialColors from '../../../vendor/material-colors'

// initial state
const state = {
  isActive: false,

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