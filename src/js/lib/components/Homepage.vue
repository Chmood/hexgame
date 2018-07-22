<template>
  
  <div id="homepage"
    :class="{ active: isActive }"
  >
    <h1>Hex Wars</h1>
    <p class="game-version">v0.1.0</p>

    <button class="btn--highlight"
      @click="doAction('new-game')"
    >New game</button>

    <button
      @click="doAction('open-options')"
    >Options</button>

    <button
      @click="doAction('quit')"
    >Quit</button>
  </div>

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.homepage.isActive
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action) {
      this.emitGameEvent('hompageAction', { detail: { 'action': action }})
    }
  }

}
</script>