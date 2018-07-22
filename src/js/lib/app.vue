<template>

  <div class="game-wrapper">

    <div class="game-viewport">
      <!-- 3d canvas -->
      <canvas id="canvas3d" touch-action="none"></canvas>
    </div>

    <!-- Game configuration panel -->
    <configuration-panel />

    <!-- Homepage screen panel -->
    <homepage-panel />

    <!-- Option panel -->
    <options-panel />

    <!-- 2d canvas -->
    <minimap />

    <!-- Top panel -->
    <topbar />

    <!-- Game menu panel -->
    <game-menu />

    <!-- Fullscreen banner-->
    <div id="big-banner" class="above text-left">
      <div id="big-banner-content"></div>
    </div>

  </div>

</template>

<script>
import HomepagePanel from './components/HomepagePanel.vue'
import OptionsPanel from './components/OptionsPanel.vue'
import ConfigurationPanel from './components/ConfigurationPanel.vue'

import Minimap from './components/Minimap.vue'
import Topbar from './components/Topbar.vue'
import GameMenu from './components/GameMenu.vue'

export default {
  components: {
    HomepagePanel,
    OptionsPanel,
    ConfigurationPanel,

    Minimap,
    Topbar,
    GameMenu
  },

  data() {
    return {}
  }
}
</script>