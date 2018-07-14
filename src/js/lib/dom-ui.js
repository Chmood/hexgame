import CONFIG from './config'

import Vue from 'vue'
import store from './store'
import VueApp from './app.vue'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = () => {

  const dom = {},
        keys = {}

  let game = {}

  // VUE JS
  dom.vm = new Vue({
    el: '#app',
    store,
    render: h => h(VueApp)
  })
  
  // Game configuration object
  const config = {
    players: CONFIG.players
  }

  const maxPlayers = 4

  // GET ELEMENTS
  dom.getElements = () => {
    // 2D and 3D canvases
    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')
  
    // Big banner
    dom.bigBanner = document.getElementById('big-banner')
    dom.bigBannerContent = document.getElementById('big-banner-content')

    // Config panel elements
    dom.optionsPanel = document.getElementById('options-panel')
    dom.btnOptionsTogglePanel = document.getElementById('options-btn-toggle-panel')
    
    dom.gameConfigurationPanel = document.getElementById('game-configuration-panel')
    dom.btnGameConfigurationPrevious = document.getElementById('game-configuration-btn-previous')
    dom.btnGameConfigurationNext = document.getElementById('game-configuration-btn-next')

    // GAME CONFIGURATION
    dom.players = []

    for (let p = 0; p < maxPlayers; p++) {
      dom.players[p] = {}
      dom.players[p].name = document.getElementById(`options-players-name-${p}`)
      dom.players[p].typeHuman = document.getElementById(`options-players-type-human-${p}`)
      dom.players[p].typeBot = document.getElementById(`options-players-type-bot-${p}`)
      dom.players[p].typeDisabled = document.getElementById(`options-players-type-disabled-${p}`)
    }

    dom.btnUpdate = document.getElementById('options-btn-update')
    dom.btnNewTerrain = document.getElementById('options-btn-new-terrain')
    dom.btnNewBuildings = document.getElementById('options-btn-new-buildings')
    dom.btnNewUnits = document.getElementById('options-btn-new-units')
    dom.btnPlay = document.getElementById('options-btn-play')
    
    dom.btnFullscreen = document.getElementById('options-btn-fullscreen')
    dom.selectPosprocess = document.getElementById('options-select-postprocess')
    dom.checkboxBetterOcean = document.getElementById('options-checkbox-better-ocean')
    dom.checkboxCameraFree = document.getElementById('options-camera-free')
    dom.checkboxCameraFreeAutoRotate = document.getElementById('options-camera-free-auto-rotate')
  }

  // SET ELEMENTS
  dom.setElements = () => {
    dom.selectPosprocess.value = CONFIG.render3d.postprocess
    dom.checkboxBetterOcean.checked = CONFIG.render3d.betterOcean
    dom.checkboxCameraFree.checked = CONFIG.render3d.camera.activeCamera === 'cameraFree'
    dom.checkboxCameraFreeAutoRotate.checked = CONFIG.render3d.camera.cameraFreeAutoRotate

    // GAME CONFIGURATION
    for (let p = 0; p < maxPlayers; p++) {
      dom.players[p].name.value = CONFIG.players[p].name
      if (CONFIG.players[p].isHuman) {
        dom.players[p].typeHuman.checked = true
      } else {
        dom.players[p].typeBot.checked = true
      }
    }

  }

  // SET EVENT LISTENERS
  dom.setEventListeners = () => {

    // Keyboard events
    const throttledOnKeyDown = throttle((event) => {
      keys[event.key] = true
      game.onKeyDown(keys)
    }, CONFIG.game.throttleKeyboardTime)

    const throttledOnKeyUp = throttle((event) => {
      delete keys[event.key]
    }, CONFIG.game.throttleKeyboardTime)
    
    document.addEventListener('keydown', throttledOnKeyDown)
    document.addEventListener('keyup', throttledOnKeyUp)

    // Mouse move over canvases
    dom.canvas2d.addEventListener('mousemove', (e) => {
      game.updateCursor(game.renderer2d.plotCursor(e))
    })
    dom.canvas3d.addEventListener('mousemove', () => {
      if (game.renderer3d.getActiveCamera().name === 'cameraFree') {
        game.updateCursor(game.renderer3d.plotCursor())
      }
    }) 

    // // Click on canvases
    // dom.canvas2d.addEventListener('click', (e) => {
    // })
    dom.canvas3d.addEventListener('click', () => {
      game.doAction()
    })

    // UI panel buttons
    dom.btnOptionsTogglePanel.addEventListener('click', () => {
      dom.optionsPanel.classList.toggle('active')
    })
    dom.btnFullscreen.addEventListener('click', () => {
      console.warn('FULLSCREEN enabled: ', document.fullscreenEnabled)
      
      if ((document.fullScreenElement && document.fullScreenElement !== null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
          document.documentElement.requestFullScreen()
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen()
        } else if (document.documentElement.webkitRequestFullScreen) {
          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
        }
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen()
        }
      }

      game.resizeGame()
    })
    // dom.btnUpdate.addEventListener('click', () => {
    //   game.generate()
    // })

    // GAME CONFIGURATION
    dom.btnGameConfigurationPrevious.addEventListener('click', () => {
      dom.changeGameConfigurationStep(-1)
    })
    dom.btnGameConfigurationNext.addEventListener('click', () => {
      dom.changeGameConfigurationStep(1)
    })

    for (let p = 0; p < maxPlayers; p++) {
      dom.players[p].name.addEventListener('change', (event) => {
        config.players[p].name = event.target.value
      })
    }
    
    dom.btnNewTerrain.addEventListener('click', () => {
      game.generateTerrain(true) // New random seed
    })
    dom.btnNewBuildings.addEventListener('click', () => {
      game.generateBuildings(true) // New random seed
    })
    dom.btnNewUnits.addEventListener('click', () => {
      game.generateUnits(true) // New random seed
    })
    dom.btnPlay.addEventListener('click', () => {
      game.startGame()
    })

    // UI panel settings
    // Select post-process
    dom.selectPosprocess.addEventListener('change', () => {
      const postprocess = dom.selectPosprocess.value
      game.renderer3d.updatePosprocessPipeline(postprocess)
    })
    // Checkbox for better ocean
    dom.checkboxBetterOcean.addEventListener('change', () => {
      game.renderer3d.updateOcean(dom.checkboxBetterOcean.checked)
      game.renderer3d.addToOceanRenderList()
    })
    // Checkbox for switching camera ('free mode')
    dom.checkboxCameraFree.addEventListener('change', () => {
      const activeCamera = dom.checkboxCameraFree.checked ? 'cameraFree' : 'camera'
      game.renderer3d.setActiveCamera(activeCamera)
    })
    // Checkbox for auto-rotating camera
    dom.checkboxCameraFreeAutoRotate.addEventListener('change', () => {
      const cameraFreeAutoRotate = dom.checkboxCameraFreeAutoRotate.checked
      game.renderer3d.setCameraFreeAutorotate(cameraFreeAutoRotate)
    })

    // Resize window
    window.onresize = () => {
      game.resizeGame()
    }
  }

  // TOP PANEL
  dom.updateTopPanel = (player) => {

    store.commit('topbar/setPlayer', { player })
  }

  dom.updateInfoMode = (mode) => {

    store.commit('topbar/setMode', { mode })
  }

  // GAME MENU

  window.addEventListener('gameMenuAction', (event) => {
    console.log('EVENT', event.detail.action)
    game[`gameMenu${event.detail.action}`]()
  })
  window.addEventListener('buildMenuAction', (event) => {
    console.log('EVENT', event.detail.unitType)
    game.gameMenuBuildUnit(event.detail.unitType)
  })

  dom.closeGameMenu = () => {

    store.commit('gameMenu/setActive', {
      active: false
    })
  }

  dom.openGameMenu = (items) => {

    const enhancedItems = []
    for (const item of items) {
      enhancedItems.push({
        type: 'game',
        label: item
      })
    }

    store.commit('gameMenu/clear')
    store.commit('gameMenu/setItems', { items: enhancedItems })
    store.commit('gameMenu/setActive', { active: true })
  }

  // Build menu
  dom.openGameBuildMenu = (building, money) => {
    store.commit('gameMenu/clear')

    let unitFamily
    if (building.type === 'factory') {
      unitFamily = 'ground'
    } else if (building.type === 'port') {
      unitFamily = 'sea'
    } else if (building.type === 'airport') {
      unitFamily = 'air'
    }

    const items = []
    for (const unitType in CONFIG.game.units) {
      const unit = CONFIG.game.units[unitType]

      if (unit.family === unitFamily) {

        items.push({
          type: 'build',
          label: unitType,
          value: unit.cost,
          disabled: (unit.cost > money) ? true : false
        })
      }
    }

    store.commit('gameMenu/setItems', { items })
    store.commit('gameMenu/setActive', { active: true })
  }

  dom.moveGameMenu = (direction) => {
    store.commit('gameMenu/move', { direction })
  }

  dom.selectGameMenu = () => {
    // Simulates a click on the menu item button
    const element = store.getters['gameMenu/getCurrentGameMenuItemElement']
    element.click()
  }


  // GAME CONFIGURATION
  dom.changeGameConfigurationStep = (increment) => {
    currentGameConfigurationStep += increment
    currentGameConfigurationStep = game.clampValueInRange(
      currentGameConfigurationStep,
      4
    )

    if (currentGameConfigurationStep > 0) {
      dom.btnGameConfigurationPrevious.disabled = false
    } else {
      dom.btnGameConfigurationPrevious.disabled = true
    }
    if (currentGameConfigurationStep < 4) {
      dom.btnGameConfigurationNext.disabled = false
    } else {
      dom.btnGameConfigurationNext.disabled = true
    }

    dom.gameConfigurationPanel.classList.remove('step-0', 'step-1', 'step-2', 'step-3', 'step-4')
    dom.gameConfigurationPanel.classList.add(`step-${currentGameConfigurationStep}`)
  }

  // BIG BANNER
  dom.displayBigBanner = (message) => {
    const delay = 500
    return new Promise((resolve) => {

      dom.bigBannerContent.textContent = message

      // above + left + active
      dom.bigBanner.classList.add('active')
  
      window.setTimeout(() => {
        // middle + left + active
        dom.bigBanner.classList.remove('above')

        window.setTimeout(() => {
          // middle + center + active
          dom.bigBanner.classList.remove('text-left')

          window.setTimeout(() => {
            // middle + right + active
            dom.bigBanner.classList.add('text-right')

            window.setTimeout(() => {
              // below + right + active
              dom.bigBanner.classList.add('below')
  
              resolve()
              window.setTimeout(() => {
                // above + left
                dom.bigBanner.classList.remove('active', 'below')
                dom.bigBanner.classList.add('above')
                dom.bigBanner.classList.remove('text-right')
                dom.bigBanner.classList.add('text-left')
    
                resolve()
              }, delay)
            }, delay)
          }, delay * 2)
        }, delay)
      }, delay)
    })
  }

  // THROTTLE
  // Use: let throttled = throttle(function, 5000)
  const throttle = (callback, delay) => {
    let isThrottled = false, args, context
  
    function wrapper() {
      if (isThrottled) {
        args = arguments
        context = this
        return
      }
  
      isThrottled = true
      callback.apply(this, arguments)
      
      setTimeout(() => {
        isThrottled = false
        if (args) {
          wrapper.apply(context, args)
          args = context = null
        }
      }, delay)
    }
  
    return wrapper
  }

  // SET GAME
  dom.setGame = (newGame) => {
    game = newGame

    Vue.prototype.$game = game
  }

  let currentGameConfigurationStep = 0

  dom.getElements()
  dom.setElements()
  dom.setEventListeners()

  return dom
}  

export default DomUI
