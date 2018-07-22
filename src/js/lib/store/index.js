import Vue from 'vue'
import Vuex from 'vuex'

import homepagePanel from './modules/homepage-panel'
import optionPanel from './modules/option-panel'
import topbar from './modules/topbar'
import gameMenu from './modules/game-menu'
import gameConfiguration from './modules/game-configuration'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    homepagePanel,
    optionPanel,
    topbar,
    gameMenu,
    gameConfiguration
  },
  strict: debug,
  plugins: []
})