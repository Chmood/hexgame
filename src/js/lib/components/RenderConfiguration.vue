<template>

  <div id="render-panel">
    <button id="options-btn-fullscreen">Fullscreen</button>
    <label for="options-select-postprocess">Post-process</label>
    <select id="options-select-postprocess">
      <option value="none">None</option>
      <option value="ssao">SSAO</option>
      <option value="multi">Multi FX</option>
    </select>
    <label for="options-checkbox-better-ocean">Realistic ocean</label>
    <input id="options-checkbox-better-ocean" type="checkbox">
    <label for="options-camera-free">Free camera</label>
    <input id="options-camera-free" type="checkbox">
    <label for="options-camera-free-auto-rotate">Auto-rotate</label>
    <input id="options-camera-free-auto-rotate" type="checkbox">
  </div>

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.gameConfiguration.isActive,

    renderConfig: state => state
  }),

  methods: {
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

