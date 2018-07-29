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
  // DOM creation
  dom.vm = new Vue({
    el: '#app',
    store,
    render: h => h(VueApp)
  })

  const CONFIG_GAME = store.getters['configuration/getGameConfig'].game
  
  // GET ELEMENTS
  dom.getElements = () => {
    // 2D and 3D canvases
    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')
  
    // Big banner
    dom.bigBanner = document.getElementById('big-banner')
    dom.bigBannerContent = document.getElementById('big-banner-content')

    // Render options panel elements
    dom.btnFullscreen = document.getElementById('options-btn-fullscreen')

    dom.selectPosprocess = document.getElementById('options-select-postprocess')
    dom.checkboxBetterOcean = document.getElementById('options-checkbox-better-ocean')
    dom.checkboxCameraFree = document.getElementById('options-camera-free')
    dom.checkboxCameraFreeAutoRotate = document.getElementById('options-camera-free-auto-rotate')
  }

  // SET EVENT LISTENERS
  dom.setEventListeners = () => {

    // Resize window
    window.onresize = () => {
      game.resizeGame()
    }

    // KEYBOARD
        
    const throttledOnKeyDown = throttle((event) => {
      keys[event.key] = true
      game.onKeyDown(keys)
    }, CONFIG_GAME.throttleKeyboardTime)

    const throttledOnKeyUp = throttle((event) => {
      delete keys[event.key]
    }, CONFIG_GAME.throttleKeyboardTime)
    
    document.addEventListener('keydown', throttledOnKeyDown)
    document.addEventListener('keyup', throttledOnKeyUp)

    // MOUSE

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
  }

  ////////////////////////////////////////
  // VUE JS COMPONENTS

  // TOP PANEL
  dom.updateTopbar = (player) => {

    store.commit('topbar/setPlayer', { player })
  }

  dom.updateInfoMode = (mode) => {

    store.commit('topbar/setMode', { mode })
  }

  // GAME MENU

  window.addEventListener('gameMenuAction', (event) => {
    game[`gameMenu${event.detail.action}`]()
  })
  window.addEventListener('buildMenuAction', (event) => {
    game.gameMenuBuildUnit(event.detail.unitType)
  })

  dom.closeGameMenu = () => {

    store.commit('gameMenu/setActive', { active: false })
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

  dom.openGameBuildMenu = (building, money) => {

    let unitFamily
    if (building.type === 'factory') {
      unitFamily = 'ground'
    } else if (building.type === 'port') {
      unitFamily = 'sea'
    } else if (building.type === 'airport') {
      unitFamily = 'air'
    }

    const items = []
    for (const unitType in CONFIG_GAME.units) {

      // Check if this unit type is allowed in the game
      if (CONFIG_GAME.units[unitType].isDisabled) {
        continue
      }

      const unit = CONFIG_GAME.units[unitType]

      if (unit.family === unitFamily) {

        items.push({
          type: 'build',
          label: unitType,
          value: unit.cost,
          disabled: (unit.cost > money) ? true : false
        })
      }
    }

    store.commit('gameMenu/clear')
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

  // SET PANEL
  dom.setPanel = (panel) => {
    // Hide panels
    store.commit('intro/setActive', { active: false })
    store.commit('homepage/setActive', { active: false })
    store.commit('options/setActive', { active: false })
    store.commit('configuration/setActive', { active: false })
    store.commit('topbar/setActive', { active: false })
    store.commit('minimap/setActive', { active: false })
 
    dom.canvas3d.classList.remove('collapsed')
    dom.canvas3d.classList.remove('half-top')

    if (panel === 'game') {
      // Also show the topbar
      store.commit('topbar/setActive', { active: true })
      // And the minimap
      store.commit('minimap/setActive', { active: true })

    } else {
      // Show the desired panel
      store.commit(`${panel}/setActive`, { active: true })

      // Intro panel doesn't show 3D canvas
      if (panel === 'intro') {
        dom.canvas3d.classList.add('collapsed')
        
      // Configuration panel uses 50% of the height
      } else if (panel === 'configuration') {
        dom.canvas3d.classList.add('half-top')
        store.commit('minimap/setActive', { active: true })
      } 
    }
  }

  // INTRO
  window.addEventListener('introAction', (event) => {
    if (event.detail.action === 'start') {
      game.openScreen('homepage')
    }
  })

  // HOMEPAGE
  window.addEventListener('hompageAction', (event) => {
    if (event.detail.action === 'new-game') {
      game.openScreen('configuration')

    } else if (event.detail.action === 'open-options') {
      // TODO: backup options (in case of canceling)

      game.openScreen('options')

    } else if (event.detail.action === 'quit') {
      game.openScreen('intro')
    }
  })

  // OPTION PANEL
  window.addEventListener('optionsAction', (event) => {
    if (event.detail.action === 'apply') {
      game.openScreen('homepage')

    } else if (event.detail.action === 'cancel') {
      // TODO: restore options

      game.openScreen('homepage')
    }
  })

  ////////////////////////////////////////
  // GAME CONFIGURATION
  window.addEventListener('configurationAction', (event) => {
    if (event.detail.action === 'terrain') {
      game.generateTerrain(event.detail.newSeed)

    } else if (event.detail.action === 'postprocess-map') {
      game.postprocessMap()

    } else if (event.detail.action === 'resynth-map') {
      game.resynthMap()

    } else if (event.detail.action === 'buildings') {
      game.generateBuildings(event.detail.newSeed)

    } else if (event.detail.action === 'units') {
      game.generateUnits(event.detail.newSeed)

    } else if (event.detail.action === 'start') {
      game.startGame()

    } else if (event.detail.action === 'cancel') {
      game.openScreen('homepage')
    }
  })

  // Players

  window.addEventListener('configurationActionUpdatePlayersColor', (event) => {
    console.log('GAME CONFIGURATION EVENT: updating players color' )
    game.renderer3d.updatePlayersColor()
    game.renderer3d.deleteUnits()
    game.renderer3d.createUnits()

    // game.renderer3d.updateBuildingsColor()
    game.renderer3d.deleteBuildings()
    game.renderer3d.createBuildings()
  })
  window.addEventListener('configurationActionClearPlayers', (event) => {
    console.log('GAME CONFIGURATION EVENT: clearing players\' buildings and units' )
    game.renderer3d.deleteBuildings()
    game.renderer3d.deleteUnits()
  })
  window.addEventListener('configurationActionUpdatePlayers', (event) => {
    console.log('GAME CONFIGURATION EVENT: updating players')
    game.renderer3d.updatePlayersColor()
    game.generateBuildings()
    game.generateUnits()
  })

  ////////////////////////////////////////
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
  }

  ////////////////////////////////////////
  // INIT

  dom.getElements()
  dom.setEventListeners()

  return dom
}  

export default DomUI
