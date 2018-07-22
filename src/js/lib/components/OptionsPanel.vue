<template>

  <div id="options-panel"
    :class="{ active: isActive }"
  >
    <h2>Options</h2>

    <!-- FULLSCREEN -->
    <!-- <button id="options-btn-fullscreen">Fullscreen</button> -->
    <div class="input-block">
      <label for="options-render-fullscreen-true">Fullscreen</label>

      <div class="input-with-unit">
        <div class="raydio">
          <input id="options-render-fullscreen-true" type="radio" name="fullscreen"
            :checked="options.fullscreen"
            @input="updateOptionFullscreen(true)"
          >
          <label for="options-render-fullscreen-true">On</label>
          <input id="options-render-fullscreen-false" type="radio" name="fullscreen"
            :checked="!options.fullscreen"
            @input="updateOptionFullscreen(false)"
          >
          <label for="options-render-fullscreen-false">Off</label>
        </div>
      </div>
    </div>

    <!-- POST-PROCESS -->
    <div class="input-block">
      <label for="options-select-postprocess">Post-process</label>
      <select id="options-select-postprocess">
        <option value="none">None</option>
        <option value="ssao">SSAO</option>
        <option value="multi">Multi FX</option>
      </select>
    </div>

    <!-- BETTER OCEAN -->
    <div class="input-block">
      <label for="options-render-better-ocean-true">Realistic ocean</label>

      <div class="input-with-unit">
        <div class="raydio">
          <input id="options-render-better-ocean-true" type="radio" name="better-ocean"
            :checked="options.betterOcean"
            @input="updateOptionBetterOcean(true)"
          >
          <label for="options-render-better-ocean-true">On</label>
          <input id="options-render-better-ocean-false" type="radio" name="better-ocean"
            :checked="!options.betterOcean"
            @input="updateOptionBetterOcean(false)"
          >
          <label for="options-render-better-ocean-false">Off</label>
        </div>
      </div>
    </div>

    <!-- <div class="input-block">
      <label for="options-camera-free">Free camera</label>
      <input id="options-camera-free" type="checkbox">
    </div>

    <div class="input-block">
      <label for="options-camera-free-auto-rotate">Auto-rotate</label>
      <input id="options-camera-free-auto-rotate" type="checkbox">
    </div> -->

    <button
      @click="doAction('cancel')"
    >Cancel</button>

    <button class="btn--highlight"
      @click="doAction('apply')"
    >Apply</button>
  </div>

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.optionsPanel.isActive,

    options: state => state.optionsPanel.options
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action) {
      this.emitGameEvent('optionsAction', { detail: { 'action': action }})
    },

    updateOptionFullscreen(fullscreen) {
      this.$store.commit('optionsPanel/updateOptionsFullscreen', { fullscreen })
    },
    updateOptionBetterOcean(betterOcean) {
      this.$store.commit('optionsPanel/updateOptionsBetterOcean', { betterOcean })
    }
  },
  
  data() {
    return {
    }
  },

  watch: {
  }
}
// // UI panel buttons
// dom.btnFullscreen.addEventListener('click', () => {
//   console.warn('FULLSCREEN enabled: ', document.fullscreenEnabled)
  
//   if ((document.fullScreenElement && document.fullScreenElement !== null) ||
//   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
//     if (document.documentElement.requestFullScreen) {
//       document.documentElement.requestFullScreen()
//     } else if (document.documentElement.mozRequestFullScreen) {
//       document.documentElement.mozRequestFullScreen()
//     } else if (document.documentElement.webkitRequestFullScreen) {
//       document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
//     }
//   } else {
//     if (document.cancelFullScreen) {
//       document.cancelFullScreen()
//     } else if (document.mozCancelFullScreen) {
//       document.mozCancelFullScreen()
//     } else if (document.webkitCancelFullScreen) {
//       document.webkitCancelFullScreen()
//     }
//   }

//   game.resizeGame()
// })

// // UI panel settings
// // Select post-process
// dom.selectPosprocess.addEventListener('change', () => {
//   const postprocess = dom.selectPosprocess.value
//   game.renderer3d.updatePosprocessPipeline(postprocess)
// })
// // Checkbox for better ocean
// dom.checkboxBetterOcean.addEventListener('change', () => {
//   game.renderer3d.updateOcean(dom.checkboxBetterOcean.checked)
//   game.renderer3d.addToOceanRenderList()
// })
// // Checkbox for switching camera ('free mode')
// dom.checkboxCameraFree.addEventListener('change', () => {
//   const activeCamera = dom.checkboxCameraFree.checked ? 'cameraFree' : 'camera'
//   game.renderer3d.setActiveCamera(activeCamera)
// })
// // Checkbox for auto-rotating camera
// dom.checkboxCameraFreeAutoRotate.addEventListener('change', () => {
//   const cameraFreeAutoRotate = dom.checkboxCameraFreeAutoRotate.checked
//   game.renderer3d.setCameraFreeAutorotate(cameraFreeAutoRotate)
// })
</script>

