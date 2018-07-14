<template>

  <div id="game-menu"
    :class="{ active: isActive }"
  >

    <button
      v-for="item in currentGameMenuItems"
      :key="item.label"
      ref="menuItems"
      class="game-menu-item"
      :class="{
        'game-menu-item--with-value': item.value > 0 ? true : false,
        'game-menu-item--disabled': item.disabled
      }"
      @click="doAction(item)"
    >
      {{ item.label }}
      <span v-if="item.value">
        {{ item.value }}
      </span>
    </button>

  </div>

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.gameMenu.isActive,
    currentGameMenuItems: state => state.gameMenu.currentGameMenuItems,
    currentGameMenuItemId: state => state.gameMenu.currentGameMenuItemId
  }),

  methods: {
    doAction(item) {
      let event
      if (item.type === 'game') {
        event = new CustomEvent('gameMenuAction', { detail: {'action': item.label }})
      } else if (item.type === 'build') {
        event = new CustomEvent('buildMenuAction', { detail: {'unitType': item.label }})
      }
      window.dispatchEvent(event)
    }
  },
  
  data() {
    return {
    }
  },

  watch: {
    currentGameMenuItemId: function (newId, oldId) {
      this.$refs.menuItems[oldId].blur() // Not stricly needed
      this.$refs.menuItems[newId].focus()
      const element = this.$refs.menuItems[newId]

      this.$store.commit('gameMenu/setCurrentGameMenuItemElement', { element })
    },
    currentGameMenuItems: function () {
      this.$nextTick()
      .then(() => {
        // DOM updated
        this.$refs.menuItems[0].focus()
        const element = this.$refs.menuItems[0]

        this.$store.commit('gameMenu/setCurrentGameMenuItemElement', { element })
      })
    }
  }
}
</script>