import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = () => {

  const dom = {},
        keys = {}
  let game = undefined

  // GET ELEMENTS
  dom.getElements = () => {
    dom.canvas2d = document.getElementById('canvas2d')
    dom.canvas2dWrapper = document.getElementById('canvas2d-wrapper')
    dom.canvas3d = document.getElementById('canvas3d')
  
    dom.btnUpdate = document.getElementById('ui-btn-update')
    dom.btnNew = document.getElementById('ui-btn-new')
    dom.selectPosprocess = document.getElementById('ui-select-postprocess')
    dom.checkboxBetterOcean = document.getElementById('ui-checkbox-better-ocean')
    dom.checkboxCameraFree = document.getElementById('ui-camera-free')
    dom.checkboxCameraAutoRotate = document.getElementById('ui-camera-auto-rotate')
  }

  // SET ELEMENTS
  dom.setElements = () => {
    dom.selectPosprocess.value = CONFIG.render3d.postprocess
    dom.checkboxBetterOcean.checked = CONFIG.render3d.betterOcean
    dom.checkboxCameraFree.checked = CONFIG.render3d.camera.activeCamera === 'cameraFree'
    dom.checkboxCameraAutoRotate.checked = CONFIG.render3d.camera.cameraFreeAutoRotate
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
    // dom.canvas3d.addEventListener('click', () => {
    //   game.doAction()
    // })

    // UI buttons
    dom.btnUpdate.addEventListener('click', () => {
      game.generate()
    })
    dom.btnNew.addEventListener('click', () => {
      game.generate(true) // New random seed
    })

    // UI SETTINGS

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
    dom.checkboxCameraAutoRotate.addEventListener('change', () => {
      CONFIG.render3d.camera.cameraFreeAutoRotate = dom.checkboxCameraAutoRotate.checked // TODO: don't mutate CONFIG!
    })

    // Resize window
    window.onresize = () => {
      game.resizeGame()
    }
  }

  // SET GAME
  dom.setGame = (newGame) => {
    game = newGame
  }

  dom.getElements()
  dom.setElements()
  dom.setEventListeners()

  return dom
}  

export default DomUI
