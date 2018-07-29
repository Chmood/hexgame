<template>

  <div id="infos"
    :class="{ active: isActive }"
  >
    <h2>Infos</h2>

    <section
      v-show="cell"
    >
      <h3>Terrain</h3>
      <div class="infos-item">
        <div class="infos-item__label">Biome</div>
        <div class="infos-item__value">
          <span :style="{ 'color': cell ? cell.biomeColor : 'inherit' }">
            {{ cell ? cell.biome : '' }}
          </span>
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Elevation</div>
        <div class="infos-item__value">
          {{ cell ? cell.elevation : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Moisture</div>
        <div class="infos-item__value">
          {{ cell ? cell.moisture : '' }}
        </div>
      </div>
    </section>

    <section
      v-show="building"
    >
      <h3>Building</h3>
      <div class="infos-item">
        <div class="infos-item__label">Type</div>
        <div class="infos-item__value">
          {{ building ? building.type : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Owner</div>
        <div class="infos-item__value">
          <span :style="{ 'color': building ? building.ownerColor : 'red' }">
            {{ (building && building.owner) ? building.owner : 'none' }}
          </span>
        </div>
      </div>
    </section>

    <section
      v-show="unit"
    >
      <h3>Unit</h3>

      <div class="infos-item">
        <div class="infos-item__label">Type</div>
        <div class="infos-item__value">
          {{ unit ? unit.type : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Family</div>
        <div class="infos-item__value">
          {{ unit ? unit.family : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">HP</div>
        <div class="infos-item__value">
          {{ unit ? unit.health : '' }}/{{ unit ? unit.maxHealth : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Strength</div>
        <div class="infos-item__value">
          {{ unit ? unit.strength : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Defense</div>
        <div class="infos-item__value">
          {{ unit ? unit.defense : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Movement</div>
        <div class="infos-item__value">
          {{ unit ? unit.movement : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Range</div>
        <div class="infos-item__value">
          {{ unit ? unit.attackRangeMin : '' }} -
          {{ unit ? unit.attackRangeMax : '' }}
        </div>
      </div>
      <div class="infos-item">
        <div class="infos-item__label">Abilities</div>
        <div class="infos-item__value">
          {{ unit ? (unit.canAttack ? 'attack, ' : '') : '' }}
          {{ unit ? (unit.canConquer ? 'conquer, ' : '') : '' }}
          {{ unit ? (unit.canHeal ? 'heal, ' : '') : '' }}
        </div>
      </div>
    </section>
  </div>

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.infos.isActive,

    cell: state => state.infos.data.cell,
    building: state => state.infos.data.building,
    unit: state => state.infos.data.unit,
  })
}
</script>