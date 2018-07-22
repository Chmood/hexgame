<template>

  <div class="game-wrapper">

    <div class="game-viewport">
      <!-- 3d canvas -->
      <canvas id="canvas3d" touch-action="none"></canvas>
    </div>

    <!-- Game configuration panel -->
    <configuration />

    <!-- Homepage screen panel -->
    <homepage />

    <!-- Option panel -->
    <options />

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
import Homepage from './components/Homepage.vue'
import Options from './components/Options.vue'
import Configuration from './components/Configuration.vue'

import Minimap from './components/Minimap.vue'
import Topbar from './components/Topbar.vue'
import GameMenu from './components/GameMenu.vue'

export default {
  components: {
    Homepage,
    Options,
    Configuration,

    Minimap,
    Topbar,
    GameMenu
  },

  data() {
    return {}
  }
}
</script>