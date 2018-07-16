import Vue from 'vue'
import Vuex from 'vuex'

import topbar from './modules/topbar'
import gameMenu from './modules/game-menu'
import gameConfiguration from './modules/game-configuration'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    topbar,
    gameMenu,
    gameConfiguration
  },
  strict: debug,
  plugins: []
})