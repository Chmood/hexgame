import Vue from 'vue'
import Vuex from 'vuex'

import homepagePanel from './modules/homepage-panel'
import optionsPanel from './modules/options-panel'
import configurationPanel from './modules/configuration-panel'

import minimap from './modules/minimap'
import topbar from './modules/topbar'
import gameMenu from './modules/game-menu'



Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    homepagePanel,
    configurationPanel,
    optionsPanel,

    minimap,
    topbar,
    gameMenu
  },
  strict: debug,
  plugins: []
})