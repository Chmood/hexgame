<template>

  <div class="game-wrapper">

    <!-- 3d canvas -->
    <canvas id="canvas3d" touch-action="none"></canvas>

    <!-- 2d canvas -->
    <div id="canvas2d-wrapper">
      <canvas id="canvas2d">
        Your browser is old, or you don't have JavaScript enabled!
      </canvas>
    </div>

    <!-- Top panel -->
    <topbar />

    <!-- UI panel -->
    <div id="options-panel">
      <p>
        <button id="options-btn-toggle-panel" style="display: none;">+</button>
        <h2>Configure the game!</h2>

        <!-- KEYS: arrows to move cursor, X to do action, C to cancel, E and R to zoom in and out, T and Y to rotate camera&nbsp;&nbsp; -->
      </p>
      <div id="game-configuration-panel" class="game-configuration step-0">
        <button id="game-configuration-btn-previous" class="game-configuration-btn game-configuration-btn--previous" disabled>&lt;</button>
        <button id="game-configuration-btn-next" class="game-configuration-btn game-configuration-btn--next">Next</button>
        <div class="game-configuration-wrapper">

          <section class="game-configuration-section">
            <h3>Players</h3>
            <section class="grid grid-1-of-2">
              <article>
                <div class="game-configuration-player">
                  <div class="label">P1</div>
                  <input id="options-players-name-0" type="text">
                  <div class="raydio">
                    <input id="options-players-type-human-0" type="radio" name="type-0" value="human">
                    <label for="options-players-type-human-0">Human</label>
                    <input id="options-players-type-bot-0" type="radio" name="type-0" value="bot">
                    <label for="options-players-type-bot-0">Bot</label>
                    <input id="options-players-type-disabled-0" type="radio" name="type-0" value="disabled">
                    <label for="options-players-type-disabled-0">Disabled</label>
                  </div>
                </div>
                <div class="game-configuration-player">
                  <div class="label">P2</div>
                  <input id="options-players-name-1" type="text">
                  <div class="raydio">
                    <input id="options-players-type-human-1" type="radio" name="type-1" value="human">
                    <label for="options-players-type-human-1">Human</label>
                    <input id="options-players-type-bot-1" type="radio" name="type-1" value="bot">
                    <label for="options-players-type-bot-1">Bot</label>
                    <input id="options-players-type-disabled-1" type="radio" name="type-1" value="disabled">
                    <label for="options-players-type-disabled-1">Disabled</label>
                  </div>
                </div>
                <div class="game-configuration-player">
                  <div class="label">P3</div>
                  <input id="options-players-name-2" type="text">
                  <div class="raydio">
                    <input id="options-players-type-human-2" type="radio" name="type-2" value="human">
                    <label for="options-players-type-human-2">Human</label>
                    <input id="options-players-type-bot-2" type="radio" name="type-2" value="bot">
                    <label for="options-players-type-bot-2">Bot</label>
                    <input id="options-players-type-disabled-2" type="radio" name="type-2" value="disabled">
                    <label for="options-players-type-disabled-2">Disabled</label>
                  </div>
                </div>
                <div class="game-configuration-player">
                  <div class="label">P4</div>
                  <input id="options-players-name-3" type="text">
                  <div class="raydio">
                    <input id="options-players-type-human-3" type="radio" name="type-3" value="human">
                    <label for="options-players-type-human-3">Human</label>
                    <input id="options-players-type-bot-3" type="radio" name="type-3" value="bot">
                    <label for="options-players-type-bot-3">Bot</label>
                    <input id="options-players-type-disabled-3" type="radio" name="type-3" value="disabled">
                    <label for="options-players-type-disabled-3">Disabled</label>
                  </div>
                </div>
              </article>
              <article>
                <div class="input-block">
                  <label for="options-players">Starting money</label>
                  <input id="options-buildings-" type="number" value="5000">
                </div>
              </article>
            </section>
          </section>

          <section class="game-configuration-section">
            <h3>Terrain</h3>
            <button id="options-btn-new-terrain">New terrain</button>
            <section class="grid grid-1-of-2">
              <article>
                <h4>Elevation</h4>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Normalize elevation</label>
                  <input id="options-postprocess-normalize" type="checkbox">
                </div>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Base frequency</label>
                  <input id="options-postprocess-normalize" type="range" min="0.1" max="10" value="2">
                </div>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Redistribution power</label>
                  <input id="options-postprocess-normalize" type="range" min="0.1" max="10" value="2">
                </div>
                <div class="input-block">
                  <label for="options-postprocess-island">Island mode</label>
                  <input id="options-postprocess-island" type="checkbox">
                </div>
              </article>
              <article>
                <h4>Moisture</h4>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Normalize moisture</label>
                  <input id="options-postprocess-normalize" type="checkbox">
                </div>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Base frequency</label>
                  <input id="options-postprocess-normalize" type="range" min="0.1" max="10" value="2">
                </div>
                <div class="input-block">
                  <label for="options-postprocess-normalize">Redistribution power</label>
                  <input id="options-postprocess-normalize" type="range" min="0.1" max="10" value="2">
                </div>
              </article>
            </section>
          </section>

          <section class="game-configuration-section">
            <h3>Buildings</h3>
            <button id="options-btn-new-buildings">New buildings</button>

            <div class="input-block">
              <label for="options-buildings-">Cities</label>
              <input id="options-buildings-" type="number" value="4">
            </div>
            <div class="input-block">
              <label for="options-buildings-">Factories</label>
              <input id="options-buildings-" type="number" value="2">
            </div>
            <div class="input-block">
              <label for="options-buildings-">Ports</label>
              <input id="options-buildings-" type="number" value="1">
            </div>
            <div class="input-block">
              <label for="options-buildings-">Airports</label>
              <input id="options-buildings-" type="number" value="1">
            </div>

            <p class="small">(all buildings are per player)</p>
          </section>

          <section class="game-configuration-section">
            <h3>Units</h3>
            <button id="options-btn-new-units">New units</button>
          </section>

          <section class="game-configuration-section">
            <h3>Start the game</h3>
            <button id="options-btn-play" class="btn-strong btn-highlight">Play!</button>
          </section>
        </div>
      </div>
      <p>
        <!-- <button id="options-btn-update">Perturbate</button>&nbsp;&nbsp; -->
      </p>
      <p style="display: none;">
        <button id="options-btn-fullscreen">Fullscreen</button>
        <label for="options-select-postprocess">Post-process</label>
        <select id="options-select-postprocess">
          <option value="none">None</option>
          <option value="ssao">SSAO</option>
          <option value="multi">Multi FX</option>
        </select>
        <label for="options-checkbox-better-ocean">Realistic ocean</label>
        <input id="options-checkbox-better-ocean" type="checkbox">
        <label for="options-camera-free">Free camera</label>
        <input id="options-camera-free" type="checkbox">
        <label for="options-camera-free-auto-rotate">Auto-rotate</label>
        <input id="options-camera-free-auto-rotate" type="checkbox">
      </p>
    </div>

    <!-- Game menu panel -->
    <div id="game-menu">
      <button class="game-menu-item" id="game-menu-Attack">Attack</button>
      <button class="game-menu-item" id="game-menu-Heal">Heal</button>
      <button class="game-menu-item" id="game-menu-Conquer">Conquer</button>
      <button class="game-menu-item" id="game-menu-Wait">Wait</button>
      <button class="game-menu-item" id="game-menu-BuildUnits">Build units</button>
      <button class="game-menu-item" id="game-menu-EndTurn">End turn</button>
      <button class="game-menu-item" id="game-menu-QuitGame">Quit game</button>
    </div>

    <!-- Fullscreen banner-->
    <div id="big-banner" class="above text-left">
      <div id="big-banner-content"></div>
    </div>

  </div>

</template>

<script>
import Topbar from './components/Topbar.vue'
export default {
  components: {
    Topbar
  },

  data() {
    return {
      bar: 'Hello Vue !'
    }
  }

}
</script>