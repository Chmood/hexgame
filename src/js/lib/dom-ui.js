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

  const config = store.getters['gameConfiguration/getGameConfig']
  
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
    }, config.game.throttleKeyboardTime)

    const throttledOnKeyUp = throttle((event) => {
      delete keys[event.key]
    }, config.game.throttleKeyboardTime)
    
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
  dom.updateTopPanel = (player) => {

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
    for (const unitType in config.game.units) {
      const unit = config.game.units[unitType]

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

  // GAME CONFIGURATION
  dom.setGameConfigurationPanel = (active) => {
    store.commit('gameConfiguration/setActive', { active })
  }

  window.addEventListener('gameConfigurationAction', (event) => {
    if (event.detail.action === 'terrain') {
      game.generateTerrain(true) // New random seed

    } else if (event.detail.action === 'buildings') {
      game.generateBuildings(true) // New random seed

    } else if (event.detail.action === 'units') {
      game.generateUnits(true) // New random seed

    } else if (event.detail.action === 'start') {
      game.startGame()
    }
  })

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
