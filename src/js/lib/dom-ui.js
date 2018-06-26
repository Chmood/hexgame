import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = () => {

  const dom = {},
        keys = {},
        gameMenuItems = ['Attack', 'Conquer', 'Wait', 'EndTurn', 'QuitGame']

  let game = {}

  // GET ELEMENTS
  dom.getElements = () => {
    // 2D and 3D canvases
    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')
  
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
    dom.btnUpdate = document.getElementById('ui-btn-update')
    dom.btnNew = document.getElementById('ui-btn-new')
    dom.selectPosprocess = document.getElementById('ui-select-postprocess')
    dom.checkboxBetterOcean = document.getElementById('ui-checkbox-better-ocean')
    dom.checkboxCameraFree = document.getElementById('ui-camera-free')
    dom.checkboxCameraFreeAutoRotate = document.getElementById('ui-camera-free-auto-rotate')
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
    document.addEventListener('keydown', (event) => {
      keys[event.key] = true
      game.onKeyDown(keys)
    })
    document.addEventListener('keyup', (event) => {
      delete keys[event.key]
    })

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
      game.doAction('mouse')
    })

    // UI panel buttons
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

  // GAME MENU
  dom.openGameMenu = (items) => {
    // Clear all existing menu items
    dom.gameMenu.classList.remove(...gameMenuItems)
    dom.gameMenuItems.forEach((item) => {
      item.classList.remove('is-selectable')
    })

    // Add the specified menu items
    for (const [index, item] of items.entries()) {
      dom.gameMenu.classList.add(item) // class on the menu
      dom[`gameMenu${item}`].classList.add('is-selectable') // class on available items
      if (index === 0) {
        // dom[`gameMenu${item}`].classList.add('is-selected')
        dom[`gameMenu${item}`].focus()
      }
    }

    // Make the menu visible
    dom.gameMenu.classList.add('active')

    // Backup items
    currentGameMenuItems = items
    currentGameMenuItemId = 0
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
              }, 750)
            }, 750)
          }, 1500)
        }, 750)
      }, 750)
    })
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
