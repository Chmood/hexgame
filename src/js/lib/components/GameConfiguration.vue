<template>

  <div id="game-panel"
    :class="{ active: isActive }"
  >
    <h2>Configure the game!</h2>

      <!-- KEYS: arrows to move cursor, X to do action, C to cancel, E and R to zoom in and out, T and Y to rotate camera&nbsp;&nbsp; -->
    <div id="game-configuration-panel" class="game-configuration"
      :class="[`step-${currentGameConfigurationStep}`]"
    >
      <button class="game-configuration-btn game-configuration-btn--previous"
        :disabled="currentGameConfigurationStep === 0"
        @click="changeStep(-1)"
      >&lt;</button>
      
      <button class="game-configuration-btn game-configuration-btn--next"
        :disabled="currentGameConfigurationStep === 4"
        @click="changeStep(+1)"
      >Next</button>

      <div class="game-configuration-wrapper">

        <!-- PLAYERS -->
        <section class="game-configuration-section">
          <header class="game-configuration-section__header">
            <h3>Players</h3>
          </header>
          <main class="game-configuration-section__body">

            <!-- <div class="colors">
              <span
                v-for="(colorVariations, colorName) in colors"
                :key="colorName"
                :style="{ 'background-color': colorVariations['500'] }"
              >{{ colorName }}</span>
            </div> -->

            <div class="game-configuration-player"
              v-for="(player, index) in config.players"
              :key="player.id"
            >
              <label class="game-configuration-player__p-color" :for="`options-players-name-${index}`"
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
          <footer class="game-configuration-section__footer">
            <p class="small">Order matters, it will be used for players' turns.</p>
          </footer>
        </section>

        <!-- TERRAIN -->
        <section class="game-configuration-section">
          <header class="game-configuration-section__header">
            <h3>Terrain</h3>
          </header>
          <main class="game-configuration-section__body">
            <button class="btn--small"
              @click="doAction('terrain')"
            >New terrain</button>

            <section class="grid grid-1-of-2">
              <article>
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
                <div class="input-block">
                  <label for="options-postprocess-island-elevation">Island mode</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input id="options-postprocess-island-elevation" type="checkbox"
                        :checked="config.map.mapPostprocess.height.islandMode"
                        @input="updateMapPostprocessIslandMode($event)"
                      >
                      <label for="options-postprocess-island-elevation">Island mode</label>
                    </div>
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-island-elevation-redistribution-power">Island redistribution power</label>
                  <div class="slidey">
                    <input id="options-postprocess-island-elevation-redistribution-power"
                      type="range" min="0.1" max="4" step="0.05"
                      :value="config.map.mapPostprocess.height.islandRedistributionPower"
                      @input="updateMapPostprocessIslandRedistributionPower($event)"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess.height.islandRedistributionPower }}
                    </span> 
                  </div>
                </div>
                
              </article>
            </section>

            <section class="grid grid-1-of-2">
              <article>
                <h4>Elevation</h4>
                <div class="input-block">
                  <label for="options-noise-elevation-frequency">Tonic frequency</label>
                  <div class="slidey">
                    <input id="options-noise-elevation-frequency"
                      type="range" min="0.1" max="2" step="0.05"
                      :value="config.map.mapNoise.height.frequencyRatio"
                      @input="updateMapNoiseFrequencyRatio($event, 'elevation')"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapNoise.height.frequencyRatio }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-elevation-octave-0">Tonic level</label>
                  <div class="slidey slidey--disabled">
                    <input id="options-noise-elevation-octave-0"
                      type="range" min="0" max="1" step="0.01" disabled
                      :value="config.map.mapNoise.height.harmonics[0]"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.height.harmonics[0] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-elevation-octave-1">1st octave level</label>
                  <div class="slidey">
                    <input id="options-noise-elevation-octave-1"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise.height.harmonics[1]"
                      @input="updateMapNoiseHarmonics($event, 1, 'elevation')"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.height.harmonics[1] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-elevation-octave-2">2nd octave level</label>
                  <div class="slidey">
                    <input id="options-noise-elevation-octave-2"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise.height.harmonics[2]"
                      @input="updateMapNoiseHarmonics($event, 2, 'elevation')"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.height.harmonics[2] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-elevation-redistribution-power">Redistribution power</label>
                  <div class="slidey">
                    <input id="options-postprocess-elevation-redistribution-power"
                      type="range" min="0.1" max="4" step="0.1"
                      :value="config.map.mapPostprocess.height.redistributionPower"
                      @input="updateMapPostprocessRedistributionPower($event, 'elevation')"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess.height.redistributionPower }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-elevation-normalize">Normalize elevation</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input id="options-postprocess-elevation-normalize" type="checkbox"
                        :checked="config.map.mapPostprocess.height.normalize"
                        @input="updateMapPostprocessNormalize($event, 'elevation')"
                      >
                      <label for="options-postprocess-elevation-normalize">Normalize elevation</label>
                    </div>
                  </div>
                </div>
              </article>
              <article>
                <h4>Moisture</h4>
                <div class="input-block">
                  <label for="options-noise-moisture-frequency">Tonic frequency</label>
                  <div class="slidey">
                    <input id="options-noise-moisture-frequency"
                      type="range" min="0.1" max="2" step="0.05"
                      :value="config.map.mapNoise.moisture.frequencyRatio"
                      @input="updateMapNoiseFrequencyRatio($event, 'moisture')"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapNoise.moisture.frequencyRatio }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-moisture-octave-0">Tonic level</label>
                  <div class="slidey slidey--disabled">
                    <input id="options-noise-moisture-octave-0"
                      type="range" min="0" max="1" step="0.01" disabled
                      :value="config.map.mapNoise.moisture.harmonics[0]"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.moisture.harmonics[0] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-moisture-octave-1">1st octave level</label>
                  <div class="slidey">
                    <input id="options-noise-moisture-octave-1"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise.moisture.harmonics[1]"
                      @input="updateMapNoiseHarmonics($event, 1, 'moisture')"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.moisture.harmonics[1] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-noise-moisture-octave-2">2nd octave level</label>
                  <div class="slidey">
                    <input id="options-noise-moisture-octave-2"
                      type="range" min="0" max="1" step="0.01"
                      :value="config.map.mapNoise.moisture.harmonics[2]"
                      @input="updateMapNoiseHarmonics($event, 2, 'moisture')"
                    >
                    <span class="slidey-value">
                      {{ Math.round(config.map.mapNoise.moisture.harmonics[2] * 100) / 100 }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-moisture-redistribution-power">Redistribution power</label>
                  <div class="slidey">
                    <input id="options-postprocess-moisture-redistribution-power"
                      type="range" min="0.1" max="4" step="0.1"
                      :value="config.map.mapPostprocess.moisture.redistributionPower"
                      @input="updateMapPostprocessRedistributionPower($event, 'moisture')"
                    >
                    <span class="slidey-value">
                      {{ config.map.mapPostprocess.moisture.redistributionPower }}
                    </span> 
                  </div>
                </div>
                <div class="input-block">
                  <label for="options-postprocess-moisture-normalize">Normalize moisture</label>
                  <div class="input-with-unit">
                    <div class="checky">
                      <input id="options-postprocess-moisture-normalize" type="checkbox"
                        :checked="config.map.mapPostprocess.moisture.normalize"
                        @input="updateMapPostprocessNormalize($event, 'moisture')"
                      >
                      <label for="options-postprocess-moisture-normalize">Normalize moisture</label>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </main>
          <footer class="game-configuration-section__footer">
          </footer>
        </section>

        <!-- BUILDINGS -->
        <section class="game-configuration-section">
          <header class="game-configuration-section__header">
            <h3>Buildings</h3>
          </header>
          <main class="game-configuration-section__body">
            <button class="btn--small"
              @click="doAction('buildings')"
            >New buildings</button>

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
          </main>
          <footer class="game-configuration-section__footer">
            <p class="small">All buildings are per player.</p>
          </footer>
        </section>

        <!-- UNITS -->
        <section class="game-configuration-section">
          <header class="game-configuration-section__header">
            <h3>Units</h3>
          </header>
          <main class="game-configuration-section__body">
            <button class="btn--small"
              @click="doAction('units')"
            >New units</button>

            <section class="grid grid-1-of-2">
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
          <footer class="game-configuration-section__footer">
          </footer>
        </section>

        <!-- START -->
        <section class="game-configuration-section">
          <header class="game-configuration-section__header">
            <h3>Start the game</h3>
          </header>
          <main class="game-configuration-section__body">
            <p>
              {{ config.players.length }} players
            </p>
            <p>
              {{ config.map.mapSize.width }}x{{ config.map.mapSize.height }} map
              ({{ config.map.mapTopped ? 'flat-topped' : 'pointy-topped' }}
              {{ config.map.mapPostprocess.height.islandMode ? ', island type' : ', normal type' }})
            </p>
            <p>
              {{ countBuildings }} buildings
            </p>
            <button
            >Cancel</button>
            <button class="btn--strong btn--highlight"
              @click="doAction('start')"
            >Play!</button>
          </main>
          <footer class="game-configuration-section__footer">
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
    isActive: state => state.gameConfiguration.isActive,
    currentGameConfigurationStep: state => state.gameConfiguration.currentGameConfigurationStep,

    config: state => state.gameConfiguration.config,
    isReady: state => state.gameConfiguration.isReady,
    colors: state => state.gameConfiguration.colors,

    countBuildings (state) {
      let count = 0
      Object.entries(state.gameConfiguration.config.game.buildings).forEach(
        ([type, building]) => {
          count += building.number  
        }
      )

      return count * state.gameConfiguration.config.players.length
    }
  }),

  methods: {
    emitGameEvent(name, eventData) {
      const event = new CustomEvent(name, eventData)
      window.dispatchEvent(event)
    },
    doAction(action) {
      this.emitGameEvent('gameConfigurationAction', { detail: {'action': action }})
    },
    changeStep(increment) {
      this.$store.commit('gameConfiguration/changeStep', { increment })
    },

    createPlayer() {
      this.$store.commit('gameConfiguration/createPlayer', { player: undefined })
      this.emitGameEvent('gameConfigurationActionUpdatePlayers', {})
    },
    deletePlayer(player) {
      // We clear players' buildings and units BEFORE deleting a player
      this.emitGameEvent('gameConfigurationActionClearPlayers', {})
      this.$store.commit('gameConfiguration/deletePlayer', { player })
      this.emitGameEvent('gameConfigurationActionUpdatePlayers', {})
    },
    updatePlayerColor(player) {// FOOOO
      this.$store.commit('gameConfiguration/updatePlayerColor', { player })
      this.emitGameEvent('gameConfigurationActionUpdatePlayersColor', {})
    },
    updatePlayerName(e, player) {
      this.$store.commit('gameConfiguration/updatePlayerName', { player, name: e.target.value })
    },
    updatePlayerType(e, player, isHuman) {
      this.$store.commit('gameConfiguration/updatePlayerType', { player, isHuman })
    },
    updatePlayerMoney(e, player) {
      this.$store.commit('gameConfiguration/updatePlayerMoney', { player, money: parseInt(e.target.value) })
    },
    updatePlayerMoneyPerBuilding(e, player) {
      this.$store.commit('gameConfiguration/updatePlayerMoneyPerBuilding', { player, money: parseInt(e.target.value) })
    },

    updateMapSize(e, dimension) {
      if (dimension === 'width') {
        this.$store.commit('gameConfiguration/updateMapSize', { 
          width: parseInt(e.target.value), 
          height: this.config.map.mapSize.height
        })
      } else {
        this.$store.commit('gameConfiguration/updateMapSize', { 
          width: this.config.map.mapSize.width,
          height: parseInt(e.target.value)
        })
      }
    },
    updateMapTopping(topped) {
      this.$store.commit('gameConfiguration/updateMapTopping', { topped })
    },
    updateMapNoiseFrequencyRatio(e, type) {
      this.$store.commit('gameConfiguration/updateMapNoiseFrequencyRatio', { 
        ratio: parseFloat(e.target.value),
        type
      })
    },
    updateMapNoiseHarmonics(e, harmonicId, type) {
      this.$store.commit('gameConfiguration/updateMapNoiseHarmonics', { 
        level: parseFloat(e.target.value),
        harmonicId,
        type
      })
      this.$forceUpdate();
    },
    updateMapPostprocessRedistributionPower(e, type) {
      this.$store.commit('gameConfiguration/updateMapPostprocessRedistributionPower', { 
        power: parseFloat(e.target.value),
        type
      })
    },
    updateMapPostprocessNormalize(e, type) {
      this.$store.commit('gameConfiguration/updateMapPostprocessNormalize', { 
        normalize: e.target.checked,
        type
      })
    },
    updateMapPostprocessIslandMode(e) {
      this.$store.commit('gameConfiguration/updateMapPostprocessIslandMode', { 
        islandMode: e.target.checked
      })
    },
    updateMapPostprocessIslandRedistributionPower(e) {
      this.$store.commit('gameConfiguration/updateMapPostprocessIslandRedistributionPower', { 
        power: parseFloat(e.target.value)
      })
    },

    updateGameBuildingsNumber(e, building, owned) {
      this.$store.commit('gameConfiguration/updateGameBuildingsNumber', { 
        number: parseInt(e.target.value),
        building,
        owned
      })
    },
    updateGameUnitsNumber(e, unit) {
      this.$store.commit('gameConfiguration/updateGameUnitsNumber', { 
        number: parseInt(e.target.value),
        unit
      })
    },
    updateGameUnitsIsDisabled(e, unit) {
      this.$store.commit('gameConfiguration/updateGameUnitsIsDisabled', { 
        isDisabled: !e.target.checked,
        unit
      })
    },
    
  },
  
  data() {
    return {
    }
  },

  watch: {
  }
}
</script>