import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 2D

const Renderer2d = (game, ctx) => {
  const renderer = {},
        map = game.map

  renderer.game = game	// Backup game
  renderer.ctx = ctx	// Backup ctx

  // COMPUTE MAP SCREEN ORIGIN
  renderer.mapComputeOrigin = (cellSize, mapTopped, mapParity) => {
    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon
    let mapOrigin = {}

    if (mapTopped === HEXLIB.FLAT) {
      mapOrigin.x = cellSize.width
      mapOrigin.y = mapParity === HEXLIB.ODD ?
        cellSize.height * Math.sqrt(3) / 2 :
        cellSize.height * 2 * hexAspect

    } else if (mapTopped === HEXLIB.POINTY) {
      mapOrigin.y = cellSize.height
      mapOrigin.x = mapParity === HEXLIB.ODD ?
        cellSize.width * hexAspect :
        cellSize.width * 2 * hexAspect
    }

    return {
      x: Math.round(mapOrigin.x),
      y: Math.round(mapOrigin.y)
    }
  }

  // COMPUTE MAP SCREEN SIZE
  renderer.mapComputeSize = (mapSize, cellSize, mapTopped) => {

    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon

    const mapRenderSize = mapTopped === HEXLIB.FLAT ?
      {
        width: (mapSize.width + 1 / 3) * 2 * 3 / 4 * cellSize.width,
        height: (mapSize.height + 1 / 2) * 2 * cellSize.height * hexAspect
      } : {
        width: (mapSize.width + 1 / 2) * 2 * cellSize.width * hexAspect,
        height: (mapSize.height + 1 / 3) * 2 * 3 / 4 * cellSize.height
      }

    return {
      width: Math.round(mapRenderSize.width),
      height: Math.round(mapRenderSize.height)
    }
  }

  // PLOT CURSOR
  renderer.plotCursor = (e) => {
    const cursor = HEXLIB.hexRound(
      HEXLIB.pixel2Hex(
        renderer.layout, 
        HEXLIB.point(
          e.offsetX - renderer.canvasOffset.x,
          e.offsetY - renderer.canvasOffset.y
        )
      )
    )
    return cursor
  }

  // GET TERRAIN COLOR
  renderer.getTerrainColor = (biome) => {
    return CONFIG.map.terrain[biome].color
  }

  // DRAWING FUNCTIONS

  // DRAW HEX
  renderer.drawHex = (corners, color = '#ffffff') => {

    // Stroke style
    renderer.ctx.lineWidth = 1
    renderer.ctx.strokeStyle = 'rgba(0,0,0,0.125)'

    // Fill style
    renderer.ctx.fillStyle = color

    renderer.ctx.beginPath()
    renderer.ctx.moveTo(corners[0].x, corners[0].y)

    for (let c = 1; c < corners.length; c++) {
      renderer.ctx.lineTo(corners[c].x, corners[c].y)
    }

    renderer.ctx.lineTo(corners[0].x, corners[0].y)
    renderer.ctx.closePath()

    renderer.ctx.fill()
    renderer.ctx.stroke()
  }

  // DRAW UNIT
  renderer.drawUnit = (corners, cornersCore, color) => {

    renderer.drawHex(corners, '#444444')
    renderer.drawHex(cornersCore, color)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // RENDER (aka draw map)

  renderer.render = () => {

    // COMPUTE UI OVERLAY

    const ui = game.ui
    const cursor = game.ui.cursor

    // CLEAR CANVAS
    // renderer.ctx.clearRect(0, 0, canvas.width, canvas.height) // TODO: canvas is undefined here!

    // MAP LOOP
    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {

        // Cell variables
        const val = map.data.terrain[x][y].height,
              valFloor = Math.floor(val),

              offset = HEXLIB.hexOffset(x, y),
              hex = HEXLIB.offset2Hex(offset, CONFIG.map.mapTopped, CONFIG.map.mapParity),

              point = HEXLIB.hex2Pixel(renderer.layout, hex),
              corners = HEXLIB.hexCorners(renderer.layout, hex),
              cornersOneThird = HEXLIB.hexCorners(renderer.layout, hex, 0.3332),
              cornersHalf = HEXLIB.hexCorners(renderer.layout, hex, 0.5),
              cornersTwoThird = HEXLIB.hexCorners(renderer.layout, hex, 0.6667),

              color = renderer.getTerrainColor(map.data.terrain[x][y].biome)

        ////////////////////////////////////
        // DRAW

        // Draw terrain mesh
        renderer.drawHex(corners, color)

        // ON-MAP UI

        // Draw cursor path
        if (game.ui.cursorPath) {
          for (let i = 0; i < game.ui.cursorPath.length; i++) {
            if (HEXLIB.hexEqual(hex, game.ui.cursorPath[i])) {
              renderer.drawHex(cornersHalf, '#0080ff')
            }
          }
        }

        // Cursor
        if (HEXLIB.hexEqual(hex, cursor)) {
          renderer.drawHex(corners, game.currentPlayer.color)
        }

        // Players
        if (game.players) {
          for (const player of game.players) {
            if (player.units) {
              for (const unit of player.units) {
                if (HEXLIB.hexEqual(hex, unit.hex)) {
                  renderer.drawUnit(cornersTwoThird, cornersOneThird, unit.color)
                }
              }
            }
          }
        }

        // CELL TEXT
        if (CONFIG.render2d.displayTileText) {
          renderer.ctx.font = '8px Arial'
          renderer.ctx.lineWidth = 0
          renderer.ctx.fillStyle = 'rgba(255,255,255,0.5)'

          // Write in black on light terrain colors
          // TODO with biomes colors
          if (valFloor === 11 || valFloor === 10 || valFloor === 9 || valFloor === 3) {
            renderer.ctx.fillStyle = 'rgba(0,0,0,0.75)'
          }

          // renderer.ctx.fillText(valFloor, point.x - 3, point.y + 3)// display height
          if (map.data.terrain[x][y].cost < 1000000) {
            renderer.ctx.fillText(Math.floor(map.data.terrain[x][y].cost), point.x - 3, point.y + 3)
          }
        }
      }
    }
  }

  // INIT OTHER THINGS
  renderer.init = () => {

    // Map origin
    renderer.mapOrigin = renderer.mapComputeOrigin(
      CONFIG.render2d.cellSize,
      CONFIG.map.mapTopped,
      CONFIG.map.mapParity
    )

    // Map render size
    renderer.mapRenderSize = renderer.mapComputeSize(
      CONFIG.map.mapSize,
      CONFIG.render2d.cellSize,
      CONFIG.map.mapTopped
    )

    // Layout
    renderer.layout = HEXLIB.layout(
      CONFIG.map.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG.render2d.cellSize.width,
        y: CONFIG.render2d.cellSize.height
      },
      renderer.mapOrigin // origin
    )
  }

  renderer.init()

  return renderer
}

export default Renderer2d