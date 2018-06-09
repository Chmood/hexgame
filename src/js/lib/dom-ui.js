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
  
    dom.btnUpdate = document.getElementById('btn-update')
    dom.btnNew = document.getElementById('btn-new')
  }

  // SET EVENT LISTENERS
  dom.setEventListeners = () => {

    // Mouse move over canvases
    dom.canvas2d.addEventListener('mousemove', (e) => {
      game.updateCursor(game.renderer2d.plotCursor(e))
    })
    dom.canvas3d.addEventListener('mousemove', () => { 
      game.updateCursor(game.renderer3d.plotCursor())
    }) 

    // Click on canvases
    dom.canvas2d.addEventListener('click', (e) => {
      game.setDestination(game.renderer2d.plotCursor(e))
    })
    dom.canvas3d.addEventListener('click', () => {
      game.setDestination(game.renderer3d.plotCursor())
    })

    // UI buttons
    dom.btnUpdate.addEventListener('click', () => {
      game.generate()
    })
    dom.btnNew.addEventListener('click', () => {
      game.generate(true) // New random seed
    })

    // Resize window
    window.onresize = () => {
      game.setSize()
    }
  }

  // SET GAME
  dom.setGame = (newGame) => {
    game = newGame
  }

  dom.getElements()
  dom.setEventListeners()
  
  return dom
}  

export default DomUI
