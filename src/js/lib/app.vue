<template>

  <div class="game-wrapper">

    <div class="game-viewport">
      <!-- 3d canvas -->
      <canvas id="canvas3d" touch-action="none"></canvas>

      <!-- Game configuration panel -->
      <game-configuration />
    </div>

    <!-- 2d canvas -->
    <div id="canvas2d-wrapper">
      <canvas id="canvas2d"></canvas>
    </div>

    <!-- Top panel -->
    <topbar />

    <!-- Option panel -->
    <option-panel />

    <!-- Game menu panel -->
    <game-menu />

    <!-- Fullscreen banner-->
    <div id="big-banner" class="above text-left">
      <div id="big-banner-content"></div>
    </div>

    <!-- Homepage screen panel -->
    <homepage-panel />

  </div>

</template>

<script>
import HomepagePanel from './components/HomepagePanel.vue'
import OptionPanel from './components/OptionPanel.vue'
import Topbar from './components/Topbar.vue'
import GameMenu from './components/GameMenu.vue'
import GameConfiguration from './components/GameConfiguration.vue'

export default {
  components: {
    HomepagePanel,
    OptionPanel,
    Topbar,
    GameMenu,
    GameConfiguration
  },

  data() {
    return {}
  }
}
</script>