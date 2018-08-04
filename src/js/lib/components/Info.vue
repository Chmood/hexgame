<template>

  <div class="info"
    v-if="cell && cell.elevation"
  >

    <section>
      <div class="infos-item">
        <div class="infos-item__label">Terrain</div>
        <div class="infos-item__value"
          v-if="cell && cell.elevation"
        >
          <span :style="{ 'color': cell.biomeColor }">
            {{ cell.biome }}
            <!-- (El: {{ cell.elevation }} / Mo: {{ cell.moisture }}) -->
          </span>
        </div>
      </div>

      <div class="infos-item">
        <div class="infos-item__label">Building</div>
        <div class="infos-item__value"
          v-if="building"
        >
          <span :style="{ 'color': building.ownerColor }">
            {{ building.type }}
          </span>
        </div>
      </div>
    </section>

    <section
      v-if="unit"
    >
      <div class="infos-item">
        <div class="infos-item__label">Unit</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          <span :style="{ 'color': unit.ownerColor }">
            {{ unit.type }}
          </span>
        </div>
      </div>

      <div class="infos-item"
        v-if="!combatmode"
      >
        <div class="infos-item__label">Family</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          {{ unit.family }}
        </div>
      </div>

      <div class="infos-item">
        <div class="infos-item__label">HP</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          <span class="small">{{ unit.maxHealth }}/</span>{{ unit.health }}
        </div>
      </div>

      <div class="infos-item">
        <div class="infos-item__label">Strength</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          <span class="small"
            v-if="unit.strengthDetails !== null"
          >({{ unit.strengthDetails }})</span>
          {{ unit.strength }}
        </div>
      </div>

      <div class="infos-item">
        <div class="infos-item__label">Defense</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          <span class="small"
            v-if="unit.defenseDetails !== null"
          >({{ unit.defenseDetails }})</span>
          {{ unit.defense }}
        </div>
      </div>

      <div class="infos-item"
        v-if="!combatmode"
      >
        <div class="infos-item__label">Movement</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          {{ unit.movement }}
        </div>
      </div>

      <div class="infos-item">
        <div class="infos-item__label">Range</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          {{ unit.attackRangeMin }} -
          {{ unit.attackRangeMax }}
        </div>
      </div>

      <div class="infos-item"
        v-if="!combatmode"
      >
        <div class="infos-item__label">Abilities</div>
        <div class="infos-item__value"
          v-if="unit"
        >
          <span class="value-item"
            v-if="unit.canAttack"
          >Attack</span>
          <span class="value-item"
            v-if="unit.canConquer"
          >Conquer</span>
          <span class="value-item"
            v-if="unit.canHeal"
          >Heal</span>
        </div>
      </div>
    </section>

  </div>

</template>

<script>

export default {
  props: [
    'd',
    'combatmode'
  ],
  computed: {
    cell: function () { return this.d.cell },
    building: function () { return this.d.building },
    unit: function () { return this.d.unit }
  }
}
</script>