<template>

  <div class="game-wrapper">

    <!-- 3d canvas -->
    <canvas id="canvas3d" touch-action="none"></canvas>

    <!-- 2d canvas -->
    <div id="canvas2d-wrapper">
      <canvas id="canvas2d">
        Your browser is old, or you don't have JavaScript enabled!
      </canvas>
    </div>

    <!-- Top panel -->
    <topbar />

    <!-- Game configuration panel -->
    <game-configuration />
    <!-- Render configuration panel -->
    <render-configuration />

    <!-- Game menu panel -->
    <game-menu />

    <!-- Fullscreen banner-->
    <div id="big-banner" class="above text-left">
      <div id="big-banner-content"></div>
    </div>

  </div>

</template>

<script>
import Topbar from './components/Topbar.vue'
import GameMenu from './components/GameMenu.vue'
import GameConfiguration from './components/GameConfiguration.vue'
import RenderConfiguration from './components/RenderConfiguration.vue'

export default {
  components: {
    Topbar,
    GameMenu,
    GameConfiguration,
    RenderConfiguration
  },

  data() {
    return {}
  }
}
</script>