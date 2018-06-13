import CONFIG from './config'

////////////////////////////////////////////////////////////////////////////////
// DOM UI

const DomUI = () => {

  const dom = {}
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
    // dom.checkboxCameraAutoRotate = document.getElementById('ui-camera-auto-rotate')
  }

  // SET ELEMENTS
  dom.setElements = () => {
    dom.selectPosprocess.value = CONFIG.render3d.postprocess
    dom.checkboxBetterOcean.checked = CONFIG.render3d.betterOcean
    // dom.checkboxCameraAutoRotate.checked = CONFIG.render3d.cameraAutoRotate
  }

  // SET EVENT LISTENERS
  dom.setEventListeners = () => {

    // // Mouse move over canvases
    // dom.canvas2d.addEventListener('mousemove', (e) => {
    //   game.updateCursor(game.renderer2d.plotCursor(e))
    // })
    // dom.canvas3d.addEventListener('mousemove', () => { 
    //   game.updateCursor(game.renderer3d.plotCursor())
    // }) 

    // // Click on canvases
    // dom.canvas2d.addEventListener('click', (e) => {
    //   game.setDestination(game.renderer2d.plotCursor(e))
    // })
    // dom.canvas3d.addEventListener('click', () => {
    //   game.setDestination(game.renderer3d.plotCursor())
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
      CONFIG.render3d.postprocess = dom.selectPosprocess.value
      game.renderer3d.updatePosprocessPipeline()
    })
    // Checkbox for better ocean
    dom.checkboxBetterOcean.addEventListener('change', () => {
      CONFIG.render3d.betterOcean = dom.checkboxBetterOcean.checked
      game.renderer3d.updateOcean()
      game.renderer3d.addToOceanRenderList()
    })
    // // Checkbox for auto-rotating camera
    // dom.checkboxCameraAutoRotate.addEventListener('change', () => {
    //   CONFIG.render3d.cameraAutoRotate = dom.checkboxCameraAutoRotate.checked
    // })

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
