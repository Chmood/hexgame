<template>

  <div id="configuration"
    :class="{ active: isActive }"
  >
    <h2>Configure the game!</h2>

    <div class="configuration-ready">
      <button class="configuration-ready__item  btn--small"
        v-for="step in ['players', 'terrain', 'buildings', 'units']"
        :key="step"
        :class="{ 
          'configuration-ready__item--good': isReady[step],
          'configuration-ready__item--active': isReadyItemActive(step)
        }"
        @click="goToStep(step)"
      >{{ step }}</button>

      <button class="configuration-ready__item  btn--small"
        :class="{
          'configuration-ready__item--good': isGameReady,
          'configuration-ready__item--active': isReadyItemActive('play')
        }"
        @click="goToStep('play')"
      >PLAY!</button>
    </div>

      <!-- KEYS: arrows to move cursor, X to do action, C to cancel, E and R to zoom in and out, T and Y to rotate camera&nbsp;&nbsp; -->
    <div class="configuration"
      :class="[`step-${currentConfigurationStep}`]"
    >
      <button class="configuration-btn configuration-btn--previous"
        :disabled="currentConfigurationStep === 0"
        @click="changeStep(-1)"
      >&lt;</button>
      
      <button class="configuration-btn configuration-btn--next"
        :disabled="currentConfigurationStep === 6"
        @click="changeStep(+1)"
      >Next</button>

      <div class="configuration-wrapper">

        <!-- PLAYERS -->
        <section class="configuration-section">
          <header class="configuration-section__header">
            <h3>Players</h3>
          </header>
          <main class="configuration-section__body">

            <div class="configuration-player"
              v-for="(player, index) in config.players"
              :key="player.id"
            >
              <label class="configuration-player__p-color" :for="`options-players-name-${index}`"
                :style="{ 'background-color': player.color, 'border-color': player.color }"
                @click="updatePlayerColor(player)"
              >
                P{{ index + 1 }}
              </label>
              <input :id="`options-players-name-${index}`" type="text"
                :value="player.name"
                @input="updatePlayerName($event, player)"
                :style="{ 'color': player.color, 'border-color': player.color }"
              >
              <div class="raydio">
                <input :id="`options-players-type-human-${index}`" type="radio" :name="`type-${index}`"
                  :checked="player.isHuman"
                  @input="updatePlayerType($event, player, true)"
                >
                <label :for="`options-players-type-human-${index}`">Human</label>
                <input :id="`options-players-type-bot-${index}`" type="radio" :name="`type-${index}`"
                  :checked="!player.isHuman"
                  @input="updatePlayerType($event, player, false)"
                >
                <label :for="`options-players-type-bot-${index}`">Bot</label>
              </div>
              <div>
                <input :id="`options-players-starting-money-${index}`"
                  type="number" step="1000" min="0"
                  :value="player.money"
                  @input="updatePlayerMoney($event, player)"
                ><span class="input-unit">$</span>
              </div>
              <div>
                <input :id="`options-players-money-per-building-${index}`"
                  type="number" step="100" min="0"
                  :value="player.moneyPerBuilding"
                  @input="updatePlayerMoneyPerBuilding($event, player)"
                ><span class="input-unit">$</span>
              </div>
              <button class="btn--small btn--highlight"
                @click="deletePlayer(player)"
              >X</button>
            </div>
            <button class="btn--small"
              @click="createPlayer()"
              :disabled="config.players.length > 3"
            >New player</button>
          </main>
          <footer class="configuration-section__footer">
            <p class="small">Order matters, it will be used for players' turns.</p>
          </footer>
        </section>

        <!-- TERRAIN - MAP -->
        <section class="configuration-section">
          <header class="configuration-section__header">
            <h3>Terrain - map</h3>
          </header>
          <main class="configuration-section__body">

            <div class="configuration-update grid grid-1-of-2">
              <div class="input-block">
                <label for="terrain-seed" class="label">Seed</label>
                <input id="terrain-seed" class="input--full" type="text"
                  :value="config.map.seed"
                  @input="updateMapSeed($event)"
                >
              </div>
              <div class="input-block">
                <div class="label">Randomize terrain</div>
                <button class="btn--small"
                  @click="doAction('terrain', true)"
                >New terrain</button>
              </div>
            </div>

            <section class="grid grid-1-of-2">
              <article>
                <h4>Map</h4>

                <div class="input-block">
                  <span class="label">Map size</span>
                  <div class="input-with-unit">
                    <input id="options-map-width" type="number" min="5" max="32" 
                      :value="config.map.mapSize.width"
                      @input="updateMapSize($event, 'width')"
                    ><span class="input-unit">hex</span>
                    x
                    <input id="options-map-height" type="number" min="5" max="32" 
                      :value="config.map.mapSize.height"
                      @input="updateMapSize($event, 'height')"
                    ><span class="input-unit">hex</span>
                  </div>
                </div>
                <div class="input-block">
                  <span class="label">Map topping</span>
                  <div class="input-with-unit">
                    <div class="raydio">
                      <input id="options-map-topping-flat" type="radio" name="topped"
                        :checked="config.map.mapTopped"
                        @input="updateMapTopping(true)"
                      >
                      <label for="options-map-topping-flat">Flat</label>
                      <input id="options-map-topping-pointy" type="radio" name="topped"
                        :checked="!config.map.mapTopped"
                        @input="updateMapTopping(false)"
                      >
                      <label for="options-map-topping-pointy">Pointy</label>
                    </div>
                  </div>
                </div>
              </article>

              <article>
                <h4>Island mode</h4>

                <div class="input-block">
                  <label for="options-postprocess-island-elevation">Island mode</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input id="options-postprocess-island-elevation" type="checkbox"
                        :checked="config.map.mapPostprocess.elevation.islandMode"
                        @input="updateMapPostprocessIslandMode($event)"
                      >
                      <label for="options-postprocess-island-elevation">Island mode</label>
                    </div>
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-island-elevation-redistribution-power">Redistribution power</label>
                  <div class="slidey"
                    :class="{ 'slidey--disabled': !config.map.mapPostprocess.elevation.islandMode }"
                  >
                    <input id="options-postprocess-island-elevation-redistribution-power"
                      type="range" min="0.1" max="4" step="0.05"
                      :value="config.map.mapPostprocess.elevation.islandRedistributionPower"
                      @input="updateMapPostprocessIslandRedistributionPower($event)"
                      :disabled="!config.map.mapPostprocess.elevation.islandMode"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess.elevation.islandRedistributionPower }}
                    </span> 
                  </div>
                </div>
                
              </article>
            </section>

          </main>
          <footer class="configuration-section__footer">
          </footer>
        </section>

        <!-- TERRAIN - ELEVATION & MOISTURE -->
        <section class="configuration-section"
          v-for="type in ['elevation', 'moisture']"
          :key="type"
        >
          <header class="configuration-section__header">
            <h3>Terrain - {{ type }}</h3>
          </header>
          <main class="configuration-section__body">
            <section class="grid grid-1-of-2">
              <article>
                <h4>Synthesis</h4>

                <div class="input-block">
                  <label :for="`options-noise-${type}-frequency`">Tonic period</label>
                  <div class="slidey">
                    <input :id="`options-noise-${type}-frequency`"
                      type="range" min="0.1" max="2" step="0.05"
                      :value="config.map.mapNoise[type].frequencyRatio"
                      @input="updateMapNoiseFrequencyRatio($event, type)"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapNoise[type].frequencyRatio }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-noise-${type}-octave-0`">Tonic level</label>
                  <div class="slidey slidey--disabled">
                    <input :id="`options-noise-${type}-octave-0`"
                      type="range" min="0" max="1" step="0.01" disabled
                      :value="config.map.mapNoise[type].harmonics[0]"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise[type].harmonics[0] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-noise-${type}-octave-1`">1st octave level</label>
                  <div class="slidey">
                    <input :id="`options-noise-${type}-octave-1`"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise[type].harmonics[1]"
                      @input="updateMapNoiseHarmonics($event, 1, type)"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise[type].harmonics[1] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-noise-${type}-octave-2`">2nd octave level</label>
                  <div class="slidey">
                    <input :id="`options-noise-${type}-octave-2`"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise[type].harmonics[2]"
                      @input="updateMapNoiseHarmonics($event, 2, type)"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise[type].harmonics[2] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
              </article>

              <article>
                <h4>Post-process</h4>

                <div class="input-block">
                  <label :for="`options-postprocess-${type}-normalize`">Normalize</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input :id="`options-postprocess-${type}-normalize`" type="checkbox"
                        :checked="config.map.mapPostprocess[type].normalize"
                        @input="updateMapPostprocessNormalize($event, type)"
                      >
                      <label :for="`options-postprocess-${type}-normalize`">Normalize</label>
                    </div>
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-postprocess-${type}-redistribution-power`">Redistribution power</label>
                  <div class="slidey">
                    <input :id="`options-postprocess-${type}-redistribution-power`"
                      type="range" min="0.1" max="10" step="0.1"
                      :value="config.map.mapPostprocess[type].redistributionPower"
                      @input="updateMapPostprocessRedistributionPower($event, type)"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess[type].redistributionPower }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-postprocess-${type}-invert`">Invert</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input :id="`options-postprocess-${type}-invert`" type="checkbox"
                        :checked="config.map.mapPostprocess[type].invert"
                        @input="updateMapPostprocessInvert($event, type)"
                      >
                      <label :for="`options-postprocess-${type}-invert`">Invert</label>
                    </div>
                  </div>
                </div>
                <div class="input-block">
                  <label :for="`options-postprocess-${type}-offset`">Offset</label>
                  <div class="slidey">
                    <input :id="`options-postprocess-${type}-offset`"
                      type="range" step="1"
                      :min="-config.map.mapValueRange[type]"
                      :max="config.map.mapValueRange[type]"
                      :value="config.map.mapPostprocess[type].offset"
                      @input="updateMapPostprocessOffset($event, type)"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess[type].offset }}
                    </span> 
                  </div>
                </div>
              </article>
            </section>

          </main>
          <footer class="configuration-section__footer">
          </footer>
        </section>

        <!-- BUILDINGS -->
        <section class="configuration-section">
          <header class="configuration-section__header">
            <h3>Buildings</h3>
          </header>
          <main class="configuration-section__body">

            <div class="configuration-update grid grid-1-of-2">
              <div class="input-block">
                <label for="buildings-seed" class="label">Buildings seed</label>
                <input id="buildings-seed" class="input--full" type="text"
                  :value="config.map.seed"
                  @input="updateMapSeed($event)"
                >
              </div>
              <div class="input-block">
                <div class="label">Randomize buildings</div>
                <button class="btn--small"
                  @click="doAction('buildings', true)"
                >New buildings</button>
              </div>
            </div>

            <section class="grid grid-1-of-2 grid-1-of-3">
              <div class="input-block"
                v-for="(building, buildingType) in config.game.buildings"              
                :key="buildingType"
              >
                <label :for="`options-buildings-${buildingType}`">{{ buildingType }}</label>
                <div class="input-with-unit">
                  <input :id="`options-buildings-${buildingType}`" type="number"  min="0"
                    class="number--small"
                    :value="config.game.buildings[buildingType].number"
                    @input="updateGameBuildingsNumber($event, building)"
                  ><span class="input-unit">x</span>
                  <input id="options-buildings-" type="number" min="0"
                    class="number--small"
                    :value="config.game.buildings[buildingType].numberOwned"
                    @input="updateGameBuildingsNumber($event, building, true)"
                  ><span class="input-unit">x</span>
                </div>
              </div>
            </section>
          </main>
          <footer class="configuration-section__footer">
            <p class="small">All buildings are per player.</p>
          </footer>
        </section>

        <!-- UNITS -->
        <section class="configuration-section">
          <header class="configuration-section__header">
            <h3>Units</h3>
          </header>
          <main class="configuration-section__body">

            <div class="configuration-update grid grid-1-of-2">
              <div class="input-block">
                <label for="units-seed" class="label">Units seed</label>
                <input id="units-seed" class="input--full" type="text"
                  :value="config.map.seed"
                  @input="updateMapSeed($event)"
                >
              </div>
              <div class="input-block">
                <div class="label">Randomize units</div>
                <button class="btn--small"
                  @click="doAction('units', true)"
                >New units</button>
              </div>
            </div>

            <section class="grid grid-1-of-2 grid-1-of-3">
              <div class="input-block"
                style="margin-bottom: 0.5rem;"
                v-for="(unit, unitType) in config.game.units"              
                :key="unitType"
              >
                <label :for="`options-units-${unitType}`">{{ unitType }}</label>
                <div class="input-with-unit">
                  <input :id="`options-units-${unitType}`" type="number" min="0"
                    class="number--small"
                    :value="config.game.units[unitType].number || 0"
                    @input="updateGameUnitsNumber($event, unit)"
                  ><span class="input-unit">x</span>

                  <div class="checky">
                    <input :id="`options-units-enabled-${unitType}`" type="checkbox"
                      :checked="!config.game.units[unitType].isDisabled"
                      @input="updateGameUnitsIsDisabled($event, unit)"
                    >
                    <label :for="`options-units-enabled-${unitType}`"></label>
                  </div>

                </div>
              </div>
            </section>


          </main>
          <footer class="configuration-section__footer">
          </footer>
        </section>

        <!-- START -->
        <section class="configuration-section">
          <header class="configuration-section__header">
            <h3>Start the game</h3>
          </header>
          <main class="configuration-section__body">
            <p>
              {{ config.map.mapSize.width }}x{{ config.map.mapSize.height }} map
              ({{ config.map.mapTopped ? 'flat-topped' : 'pointy-topped' }}
              {{ config.map.mapPostprocess.elevation.islandMode ? ', island type' : ', normal type' }})
            </p>
            <p>{{ config.players.length }} players</p>
            <p>{{ countBuildings }} buildings</p>
            <p>{{ countUnits }} units</p>

            <button
              @click="doAction('cancel')"
            >Cancel</button>

            <button class="btn--strong btn--highlight"
              :disabled="!isGameReady"
              @click="doAction('start')"
            >Play!</button>
          </main>
          <footer class="configuration-section__footer">
          </footer>
        </section>
      </div>
    </div>
  </div>

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: mapState({
    isActive: state => state.configuration.isActive,
    currentConfigurationStep: state => state.configuration.currentConfigurationStep,

    config: state => state.configuration.config,
    isReady: state => state.configuration.isReady,
    colors: state => state.configuration.colors,

    countBuildings (state) {
      let count = 0
      Object.entries(state.configuration.config.game.buildings).forEach(
        ([type, building]) => {
          count += building.number  
        }
      )

      return count * state.configuration.config.players.length
    },
    countUnits (state) {
      let count = 0
      
      Object.entries(state.configuration.config.game.units).forEach(
        ([type, unit]) => {
          count += unit.number  
        }
      )

      return count * state.configuration.config.players.length
    },

    isGameReady (state) {
      return state.configuration.isReady.players &&
              state.configuration.isReady.terrain  &&
              state.configuration.isReady.buildings &&
              state.configuration.isReady.units
    }
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action, newSeed = false) {
      this.emitGameEvent('configurationAction', { detail: {
        'action': action,
        'newSeed': newSeed
      }})
    },
    changeStep(increment) {
      this.$store.commit('configuration/changeStep', { increment })
    },
    goToStep(step) {
      let index = 0
      if (step === 'players') {
        index = 0
      } else if (step === 'terrain') {
        index = 1
      } else if (step === 'buildings') {
        index = 4
      } else if (step === 'units') {
        index = 5
      } else if (step === 'play') {
        index = 6
      }

      this.$store.commit('configuration/goToStep', { index })
    },
    isReadyItemActive (step) {
      if (step === 'players') {
        if (this.currentConfigurationStep === 0) {
          return true
        }
      } else if (step === 'terrain') {
        if (
          this.currentConfigurationStep === 1 ||
          this.currentConfigurationStep === 2 ||
          this.currentConfigurationStep === 3
        ) {
          return true
        }
      } else if (step === 'buildings') {
        if (this.currentConfigurationStep === 4) {
          return true
        }
      } else if (step === 'units') {
        if (this.currentConfigurationStep === 5) {
          return true
        }
      } else if (step === 'play') {
        if (this.currentConfigurationStep === 6) {
          return true
        }
      }

      return false
    },

    // PLAYERS
    createPlayer() {
      this.$store.commit('configuration/createPlayer', { player: undefined })
      this.emitGameEvent('configurationActionUpdatePlayers', {})
    },
    deletePlayer(player) {
      // We clear players' buildings and units BEFORE deleting a player
      this.emitGameEvent('configurationActionClearPlayers', {})
      this.$store.commit('configuration/deletePlayer', { player })
      this.emitGameEvent('configurationActionUpdatePlayers', {})
    },
    updatePlayerColor(player) {// FOOOO
      this.$store.commit('configuration/updatePlayerColor', { player })
      this.emitGameEvent('configurationActionUpdatePlayersColor', {})
    },
    updatePlayerName(e, player) {
      this.$store.commit('configuration/updatePlayerName', { player, name: e.target.value })
    },
    updatePlayerType(e, player, isHuman) {
      this.$store.commit('configuration/updatePlayerType', { player, isHuman })
    },
    updatePlayerMoney(e, player) {
      this.$store.commit('configuration/updatePlayerMoney', { player, money: parseInt(e.target.value) })
    },
    updatePlayerMoneyPerBuilding(e, player) {
      this.$store.commit('configuration/updatePlayerMoneyPerBuilding', { player, money: parseInt(e.target.value) })
    },

    // MAP TERRAIN
    updateMapSeed(e) {
      this.$store.commit('configuration/updateMapSeed', { seed: e.target.value })
    },
    updateMapSize(e, dimension) {
      if (dimension === 'width') {
        this.$store.commit('configuration/updateMapSize', { 
          width: parseInt(e.target.value), 
          height: this.config.map.mapSize.height
        })
      } else {
        this.$store.commit('configuration/updateMapSize', { 
          width: this.config.map.mapSize.width,
          height: parseInt(e.target.value)
        })
      }

      // TODO: re-create a terrain from scratch and inject it into renderers
      // replace camera target to center of the (new) map
      this.doAction('terrain')
      this.doAction('buildings')
      this.doAction('units')
    },
    updateMapTopping(topped) {
      // TODO: make reactive
      this.$store.commit('configuration/updateMapTopping', { topped })
    },
    updateMapNoiseFrequencyRatio(e, type) {
      this.$store.commit('configuration/updateMapNoiseFrequencyRatio', { 
        ratio: parseFloat(e.target.value),
        type
      })

      this.doAction('resynth-map')
    },
    updateMapNoiseHarmonics(e, harmonicId, type) {
      this.$store.commit('configuration/updateMapNoiseHarmonics', { 
        level: parseFloat(e.target.value),
        harmonicId,
        type
      })

      this.$forceUpdate();
      this.doAction('resynth-map')
    },
    // Post-processing
    updateMapPostprocessRedistributionPower(e, type) {
      this.$store.commit('configuration/updateMapPostprocessRedistributionPower', { 
        power: parseFloat(e.target.value),
        type
      })

      this.doAction('postprocess-map')
    },
    updateMapPostprocessOffset(e, type) {
      this.$store.commit('configuration/updateMapPostprocessOffset', { 
        offset: parseFloat(e.target.value),
        type
      })

      this.doAction('postprocess-map')
    },
    updateMapPostprocessNormalize(e, type) {
      this.$store.commit('configuration/updateMapPostprocessNormalize', { 
        normalize: e.target.checked,
        type
      })

      this.doAction('postprocess-map')
    },
    updateMapPostprocessInvert(e, type) {
      this.$store.commit('configuration/updateMapPostprocessInvert', { 
        invert: e.target.checked,
        type
      })

      this.doAction('postprocess-map')
    },
    updateMapPostprocessIslandMode(e) {
      this.$store.commit('configuration/updateMapPostprocessIslandMode', { 
        islandMode: e.target.checked
      })

      this.doAction('postprocess-map')
    },
    updateMapPostprocessIslandRedistributionPower(e) {
      this.$store.commit('configuration/updateMapPostprocessIslandRedistributionPower', { 
        power: parseFloat(e.target.value)
      })

      this.doAction('postprocess-map')
    },

    // BUILDINGS
    updateGameBuildingsNumber(e, building, owned) {
      this.$store.commit('configuration/updateGameBuildingsNumber', { 
        number: parseInt(e.target.value),
        building,
        owned
      })
      this.doAction('buildings')
    },

    // UNITS
    updateGameUnitsNumber(e, unit) {
      this.$store.commit('configuration/updateGameUnitsNumber', { 
        number: parseInt(e.target.value),
        unit
      })
      this.doAction('units')
    },
    updateGameUnitsIsDisabled(e, unit) {
      this.$store.commit('configuration/updateGameUnitsIsDisabled', { 
        isDisabled: !e.target.checked,
        unit
      })
      this.doAction('units')
    }
  },
  
  data() {
    return {
    }
  },

  watch: {
  }
}
</script>