import Vue from 'vue'
import Vuex from 'vuex'

import homepage from './modules/homepage'
import options from './modules/options'
import configuration from './modules/configuration'

import minimap from './modules/minimap'
import topbar from './modules/topbar'
import gameMenu from './modules/game-menu'



Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    homepage,
    configuration,
    options,

    minimap,
    topbar,
    gameMenu
  },
  strict: debug,
  plugins: []
})