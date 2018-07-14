<template>

  <div id="top-panel"
    :class="{ active: isActive }"
  >
    <section class="itembar">
      <div class="itembar-item">
        Player <span>{{ player.name }}</span>
      </div>
      <div class="itembar-item">
        Money <span>{{ player.money }}</span>$
      </div>
    </section>

    <section class="itembar">
      <div class="itembar-item">
        Mode <span>{{ mode }}</span>
      </div>
    </section>
  </div>

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.topbar.isActive,
    player: state => state.topbar.player,
    mode: state => state.topbar.mode,
  })
}
</script>