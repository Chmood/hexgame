<template>
  
  <div id="minimap"
    :class="{ active: isActive }"
  >
    <canvas id="canvas2d"></canvas>
  </div>

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.minimap.isActive
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action) {
      this.emitGameEvent('minimapAction', { detail: { 'action': action }})
    }
  }

}
</script>