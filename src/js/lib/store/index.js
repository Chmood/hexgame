import Vue from 'vue'
import Vuex from 'vuex'

import intro from './modules/intro'
import homepage from './modules/homepage'
import options from './modules/options'
import configuration from './modules/configuration'

import minimap from './modules/minimap'
import topbar from './modules/topbar'
import gameMenu from './modules/game-menu'
import infos from './modules/infos'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    intro,
    homepage,
    configuration,
    options,

    minimap,
    topbar,
    gameMenu,
    infos
  },
  strict: debug,
  plugins: []
})