<template>

  <div class="game-wrapper">

    <div class="game-viewport">
      <!-- 3d canvas -->
      <canvas id="canvas3d" touch-action="none"></canvas>
    </div>

    <!-- Introl -->
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

export default {
  components: {
    Intro,
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