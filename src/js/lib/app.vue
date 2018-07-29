<template>

  <div class="game-wrapper"
    :class="{
      'active-intro': isIntroActive,
      'active-homepage': isHomepageActive,
      'active-options': isOptionsActive,
      'active-configuration': isConfigurationActive,
      'active-minimap': isMinimapActive,
      'active-game-menu': isGameMenuActive,
      'active-infos': isInfosActive,
      'active-topbar': isTopbarActive
    }"
  >

    <div class="game-viewport">
      <!-- 3d canvas -->
      <canvas id="canvas3d" touch-action="none"></canvas>
    </div>

    <!-- Intro -->
    <intro />

    <!-- Configuration -->
    <configuration />

    <!-- Homepage -->
    <homepage />

    <!-- Options -->
    <options />

    <!-- 2d canvas -->
    <minimap />

    <!-- Topbar -->
    <topbar />

    <!-- Infos -->
    <infos />

    <!-- Game menu -->
    <game-menu />

    <!-- Fullscreen banner-->
    <div id="big-banner" class="above text-left">
      <div id="big-banner-content"></div>
    </div>

  </div>

</template>

<script>
import Intro from './components/Intro.vue'
import Homepage from './components/Homepage.vue'
import Options from './components/Options.vue'
import Configuration from './components/Configuration.vue'

import Minimap from './components/Minimap.vue'
import Topbar from './components/Topbar.vue'
import GameMenu from './components/GameMenu.vue'
import Infos from './components/Infos.vue'

import { mapState } from 'vuex'

export default {
  components: {
    Intro,
    Homepage,
    Options,
    Configuration,

    Minimap,
    Topbar,
    GameMenu,
    Infos
  },

  computed: mapState({
    isIntroActive: state => state.intro.isActive,
    isHomepageActive: state => state.homepage.isActive,
    isConfigurationActive: state => state.configuration.isActive,
    isOptionsActive: state => state.options.isActive,
    isMinimapActive: state => state.minimap.isActive,
    isGameMenuActive: state => state.gameMenu.isActive,
    isInfosActive: state => state.infos.isActive,
    isTopbarActive: state => state.topbar.isActive,
  }),

  data() {
    return {}
  }
}
</script>