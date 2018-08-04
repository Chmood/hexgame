<template>

  <div id="infos"
    :class="{ active: isActive }"
  >
    <!-- v-if="cell || building || unit" -->
    <h2>{{ combatMode ? 'Combat' : 'Infos' }}</h2>

    <div class="infos-dual">
      <info :d="dataAttacker" :combatmode="combatMode" />
      <info :d="data" :combatmode="combatMode" />
    </div>

  </div>

</template>

<script>
import Info from './Info.vue'

import { mapState } from 'vuex'

export default {
  components: {
    Info
  },

  computed: mapState({
    isActive: state => state.infos.isActive,

    combatMode: state => 
      state.infos.dataAttacker.cell !== null &&
      state.infos.dataAttacker.cell.elevation !== undefined,

    data: state => state.infos.data,
    dataAttacker: state => state.infos.dataAttacker,
  })
}
</script>