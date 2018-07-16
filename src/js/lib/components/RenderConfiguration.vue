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
</script>