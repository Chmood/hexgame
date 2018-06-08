import HEXLIB from '../vendor/hexlib.js'
import * as shadeBlend from '../vendor/shadeblend.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER

const Renderer = (game, ctx, config) => {
  const renderer = {},
        map = game.map

  renderer.game = game	// Backup game
  renderer.ctx = ctx	// Backup ctx

  // COMPUTE MAP SCREEN ORIGIN

  renderer.mapComputeOrigin = (cellSize, mapTopped, mapParity, mapRange, mapRangeScale) => {
    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon
    const pespectiveRangeHeight = mapRange * mapRangeScale
    let mapOrigin = {}

    if (mapTopped === HEXLIB.FLAT) {
      mapOrigin.x = cellSize.width
      mapOrigin.y = mapParity === HEXLIB.ODD ?
        cellSize.height * Math.sqrt(3) / 2 + pespectiveRangeHeight :
        cellSize.height * 2 * hexAspect + pespectiveRangeHeight

    } else if (mapTopped === HEXLIB.POINTY) {
      mapOrigin.y = cellSize.height + pespectiveRangeHeight
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

  renderer.mapComputeSize = (mapSize, cellSize, mapTopped, mapDeepness, mapRange, mapRangeScale) => {

    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon
    const perspectiveHeight = mapDeepness + mapRange * mapRangeScale

    const mapRenderSize = mapTopped === HEXLIB.FLAT ?
      {
        width: (mapSize.width + 1 / 3) * 2 * 3 / 4 * cellSize.width,
        height: (mapSize.height + 1 / 2) * 2 * cellSize.height * hexAspect + perspectiveHeight
      } : {
        width: (mapSize.width + 1 / 2) * 2 * cellSize.width * hexAspect,
        height: (mapSize.height + 1 / 3) * 2 * 3 / 4 * cellSize.height + perspectiveHeight
      }

    return {
      width: Math.round(mapRenderSize.width),
      height: Math.round(mapRenderSize.height)
    }
  }

  // PLOT CURSOR

  renderer.plotCursor = (e) => {
    const cursor = HEXLIB.hexRound(HEXLIB.pixel2Hex(renderer.layout, HEXLIB.point(
      e.x - renderer.canvasOffset.x,
      e.y - renderer.canvasOffset.y + CONFIG.render.mapDeepness + CONFIG.render.mapRangeScale * CONFIG.map.mapSeaMinLevel	// TODO - better mapping
    )))

    return cursor
  }

  // GET TERRAIN COLOR

  renderer.getTerrainColor = (biome) => {
    return CONFIG.map.terrain[biome].color
  }

  // Z-SORTING (*kind of*)

  renderer.zIndexSort = (index, total, mapParity) => {
    let x
    if (total % 2 === 1) {
      x = mapParity === HEXLIB.EVEN ? index * 2 + 1 : x = index * 2
      if (x >= total) x -= total

    } else {
      if (mapParity === HEXLIB.EVEN) {
        x = index * 2 + 1
        if (x >= total) x -= total + 1
      } else {
        x = index * 2
        if (x >= total) x -= total - 1
      }
    }

    return x
  }

  // DRAWING FUNCTIONS

  // DRAW POLYGON

  renderer.drawPolygon = (corners, h = 0, color = '#ffffff') => {

    // Stroke style
    renderer.ctx.lineWidth = 1
    renderer.ctx.strokeStyle = 'rgba(0,0,0,0.125)'

    // Fill style
    renderer.ctx.fillStyle = color

    renderer.ctx.beginPath()
    renderer.ctx.moveTo(corners[0].x, corners[0].y + h)

    for (let c = 1; c < corners.length; c++) {
      renderer.ctx.lineTo(corners[c].x, corners[c].y + h)
    }

    renderer.ctx.lineTo(corners[0].x, corners[0].y + h)
    renderer.ctx.closePath()

    renderer.ctx.fill()
    renderer.ctx.stroke()
  }

  // DRAW HEXAGON

  renderer.drawHex = (corners, h, color) => {
    renderer.drawPolygon(
      [corners[0], corners[1], corners[2], corners[3], corners[4], corners[5]],
      h,
      color
    )
  }

  // DRAW HEX SIDES

  renderer.drawHexSides = (corners, h, h2, color) => {

    // Front-right side
    renderer.drawPolygon([
      { x: corners[0].x, y: corners[0].y + h },
      { x: corners[0].x, y: corners[0].y + h2 },
      { x: corners[1].x, y: corners[1].y + h2 },
      { x: corners[1].x, y: corners[1].y + h }
    ], 0, shadeBlend(-0.25, color))

    // Front-left side (void if POINTY)
    if (CONFIG.map.mapTopped !== 'pointy') {
      renderer.drawPolygon([
        { x: corners[2].x, y: corners[2].y + h },
        { x: corners[2].x, y: corners[2].y + h2 },
        { x: corners[3].x, y: corners[3].y + h2 },
        { x: corners[3].x, y: corners[3].y + h }
      ], 0, shadeBlend(0.25, color))
    }

    // Front (front-left side if POINTY)
    renderer.drawPolygon([
      { x: corners[1].x, y: corners[1].y + h },
      { x: corners[1].x, y: corners[1].y + h2 },
      { x: corners[2].x, y: corners[2].y + h2 },
      { x: corners[2].x, y: corners[2].y + h }
    ], 0, CONFIG.map.mapTopped !== 'pointy' ?
        shadeBlend(0.0, color) : // middle
        shadeBlend(0.25, color)) // left
  }

  // DRAW HEX TOP

  renderer.drawHexTop = (corners, h, color) => {
    renderer.ctx.fillStyle = color
    renderer.drawHex(corners, h, color)
  }

  // DRAW HEX MESH

  renderer.drawHexMesh = (corners, h, h2, color) => {

    // Draw sides
    if (CONFIG.render.mapHasPerspective) {
      renderer.drawHexSides(corners, h, h2, color)
    }
    // Draw top
    renderer.drawHexTop(corners, h, color)
  }

  // DRAW HEX BASE

  renderer.drawHexBase = (corners, cornersCore, h, h2, color) => {

    renderer.drawHexMesh(corners, h, h2, '#444444')
    renderer.drawHexMesh(cornersCore, h, h + 2, color)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // DRAW MAP

  renderer.drawMap = (ctx, mapTopped, mapParity, mapDeepness, mapRangeScale) => {

    // COMPUTE UI OVERLAY

    const ui = game.ui
    const cursor = game.ui.cursor

    // Cursor path
    let cursorPath = undefined
    if (map.getFromHex(cursor) && map.getFromHex(cursor).isInGraph) {
      cursorPath = map.findPath(game.players[0].hex, cursor)
    }

    // CLEAR CANVAS
    // ctx.clearRect(0, 0, canvas.width, canvas.height) // TODO: canvas is undefined here!

    // MAP LOOP
    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let xi = 0; xi < CONFIG.map.mapSize.width; xi++) {

        // Display front cells first
        let x = renderer.zIndexSort(xi, CONFIG.map.mapSize.width, mapParity)

        // Cell variables
        const val = map.data[x][y].height,
          valFlooded = Math.max(val, CONFIG.map.mapSeaMinLevel),
          valFloor = Math.floor(val),

          offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(offset, CONFIG.map.mapTopped, CONFIG.map.mapParity),

          // point = HEXLIB.hex2Pixel(renderer.layout, hex), // Not in use for now
          corners = HEXLIB.hexCorners(renderer.layout, hex),
          cornersOneThird = HEXLIB.hexCorners(renderer.layout, hex, 0.3332),
          cornersHalf = HEXLIB.hexCorners(renderer.layout, hex, 0.5),
          cornersTwoThird = HEXLIB.hexCorners(renderer.layout, hex, 0.6667),

          color = renderer.getTerrainColor(map.data[x][y].biome), // Cell color
          h = CONFIG.render.mapHasPerspective ?
            - Math.floor(valFlooded) * mapRangeScale : 0 // Cell height


        ////////////////////////////////////
        // DRAW

        // Draw terrain mesh
        renderer.drawHexMesh(corners, h, mapDeepness, color)

        // ON-MAP UI

        // Drawline
        for (let i = 0; i < ui.line.length; i++) {
          if (HEXLIB.hexEqual(hex, ui.line[i])) {
            renderer.drawHexTop(cornersHalf, h, game.players[1].color)
          }
        }

        // Draw cursor path
        if (cursorPath) {
          for (let i = 0; i < cursorPath.length; i++) {
            if (HEXLIB.hexEqual(hex, cursorPath[i])) {
              renderer.drawHexTop(cornersHalf, h, '#0080ff')
            }
          }
        }

        // Cursor
        if (HEXLIB.hexEqual(hex, cursor)) {
          renderer.drawHexTop(corners, h, game.players[0].color)
        }

        // Players
        if (game.players) {
          for (let p = 0; p < game.players.length; p++) {
            if (HEXLIB.hexEqual(hex, game.players[p].hex)) {
              // renderer.drawHexTop(corners, h, game.players[p].color)
              // Draw terrain mesh 
              renderer.drawHexBase(cornersTwoThird, cornersOneThird, h - 20, h, game.players[p].color)
            }
          }
        }

        // CELL TEXT
        if (CONFIG.render.displayTileText) {
          ctx.font = '10px Arial'
          ctx.lineWidth = 0
          ctx.fillStyle = 'rgba(255,255,255,0.5)'

          // Write in black on light terrain colors
          // TODO with biomes colors
          if (valFloor === 11 || valFloor === 10 || valFloor === 9 || valFloor === 3) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)'
          }

          // ctx.fillText(valFloor, point.x - 3, point.y + 3 + h)// display height
          // if (map.data[x][y].cost < 1000000) {
          // 	ctx.fillText(map.data[x][y].cost, point.x - 3, point.y + 3 + h)
          // }
        }
      }
    }
  }

  // INIT OTHER THINGS

  renderer.init = () => {

    // Map origin
    renderer.mapOrigin = renderer.mapComputeOrigin(
      CONFIG.render.cellSize,
      CONFIG.map.mapTopped,
      CONFIG.map.mapParity,
      CONFIG.map.mapValueRange.height,
      CONFIG.render.mapRangeScale
    )

    // Map render size
    renderer.mapRenderSize = renderer.mapComputeSize(
      CONFIG.map.mapSize,
      CONFIG.render.cellSize,
      CONFIG.map.mapTopped,
      CONFIG.render.mapDeepness,
      CONFIG.map.mapValueRange.height,
      CONFIG.render.mapRangeScale
    )

    // Layout
    renderer.layout = HEXLIB.layout(
      CONFIG.map.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG.render.cellSize.width,
        y: CONFIG.render.cellSize.height
      },
      renderer.mapOrigin // origin
    )
  }

  renderer.init()

  return renderer
}

export default Renderer