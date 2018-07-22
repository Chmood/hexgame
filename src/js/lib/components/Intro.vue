<template>

  <div id="intro"
    :class="{ active: isActive }"
  >
    <h1>Hex Wars</h1>
    <p class="game-version" >v0.1.0</p>

    <button class="btn--highlight"
      @click="doAction('start')"
    >Play!</button>

    <button class="" disabled
    >Login</button>

    <button class="" disabled
    >Register</button>
  </div>

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.intro.isActive
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action) {
      this.emitGameEvent('introAction', { detail: { 'action': action }})
    }
  }
}
</script>