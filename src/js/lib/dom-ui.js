import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = () => {

  const dom = {},
        keys = {},
        gameMenuItems = ['Attack', 'Heal', 'Conquer', 'Wait', 'BuildUnits', 'EndTurn', 'QuitGame']

  let game = {}

  // GET ELEMENTS
  dom.getElements = () => {
    // 2D and 3D canvases
    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')
  
    // Top panel
    dom.playerName = document.getElementById('player-name')
    dom.playerMoney = document.getElementById('player-money')

    // Game menu and its items
    dom.gameMenu = document.getElementById('game-menu')
    dom.gameMenuItems = document.querySelectorAll('.game-menu-item')
    for (const item of gameMenuItems) {
      dom[`gameMenu${item}`] = document.getElementById(`game-menu-${item}`)
    }

    // Big banner
    dom.bigBanner = document.getElementById('big-banner')
    dom.bigBannerContent = document.getElementById('big-banner-content')

    // Config panel elements
    dom.optionsPanel = document.getElementById('options-panel')
    dom.btnOptionsTogglePanel = document.getElementById('options-btn-toggle-panel')
    dom.btnFullscreen = document.getElementById('options-btn-fullscreen')
    dom.btnUpdate = document.getElementById('options-btn-update')
    dom.btnNew = document.getElementById('options-btn-new')
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
    dom.btnUpdate.addEventListener('click', () => {
      game.generate()
    })
    dom.btnNew.addEventListener('click', () => {
      game.generate(true) // New random seed
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

    // Game menu
    for (const item of gameMenuItems) {
      dom[`gameMenu${item}`].addEventListener('click', () => {
        game[`gameMenu${item}`]()
      })
    }

    // Resize window
    window.onresize = () => {
      game.resizeGame()
    }
  }

  // TOP PANEL
  dom.updateTopPanel = (player) => {
    dom.playerName.textContent = player.name
    dom.playerMoney.textContent = player.money
  }

  // GAME MENU
  // Clear all existing menu items
  dom.clearGameMenu = () => {
    // Remove items visibility menu classes
    dom.gameMenu.classList.remove(...gameMenuItems)
    // Remove items selectability classes
    dom.gameMenuItems.forEach((item) => {
      item.classList.remove('is-selectable')
    })
    // Remove dynamic items (build menu)
    const dynamicItems = document.querySelectorAll('.game-menu-item--dynamic')
    dynamicItems.forEach(function(dynamicItem) {
      dynamicItem.remove()
    })
  }

  dom.activateGameMenu = (items) => {
    // Make the menu visible
    dom.gameMenu.classList.add('active')

    // Backup items
    currentGameMenuItems = items
    currentGameMenuItemId = 0

    // Give the focus to the first menu item
    dom[`gameMenu${currentGameMenuItems[0]}`].focus()
  }

  dom.openGameMenu = (items) => {
    dom.clearGameMenu()

    // Add the specified menu items
    for (const item of items) {
      dom.gameMenu.classList.add(item) // class on the menu
      dom[`gameMenu${item}`].classList.add('is-selectable') // class on available items
    }

    dom.activateGameMenu(items)
  }

  // Build menu
  dom.openGameBuildMenu = (building, money) => {
    dom.clearGameMenu()

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
        const menuItem = document.createElement("button")
        // menuItem.id = `game-menu-${unitType}`
        menuItem.classList.add('game-menu-item', 'game-menu-item--dynamic')
        menuItem.innerHTML = `${unitType} <span>(${unit.cost})</span>`
        items.push(unitType)

        if (unit.cost <= money) {
          menuItem.addEventListener('click', () => {
            game.gameMenuBuildUnit(unitType)
          })
        } else {
          menuItem.classList.add('game-menu-item--disabled')
        }

        dom.gameMenu.appendChild(menuItem)

        // Backup item
        dom[`gameMenu${unitType}`] = menuItem
      }
    }

    dom.activateGameMenu(items)
  }

  dom.closeGameMenu = () => {
    dom.gameMenu.classList.remove('active')
  }

  dom.moveGameMenu = (direction) => {
    const increment = direction === 'up' ? -1 : 1
    currentGameMenuItemId += increment

    // Wrap index
    if (currentGameMenuItemId < 0) {
      currentGameMenuItemId += currentGameMenuItems.length
    } else if (currentGameMenuItemId >= currentGameMenuItems.length) {
      currentGameMenuItemId -= currentGameMenuItems.length
    }

    // Give the focus to the selected menu item button
    dom[`gameMenu${currentGameMenuItems[currentGameMenuItemId]}`].focus()
  }

  dom.selectGameMenu = () => {
    // Simulates a click on the menu item button
    dom[`gameMenu${currentGameMenuItems[currentGameMenuItemId]}`].click()
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
  }

  let currentGameMenuItems = []
  let currentGameMenuItemId = undefined

  dom.getElements()
  dom.setElements()
  dom.setEventListeners()

  return dom
}  

export default DomUI
