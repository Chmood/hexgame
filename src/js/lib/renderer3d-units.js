import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D UNITS

const Units = (game, map, camera) => {
  
  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // UPDATE HEALTH BAR
  renderer.updateHealthbar = (unit) => {
    const healthbarUnitWidth = CONFIG.render3d.cellSize * CONFIG.render3d.healthbars.width,
          healthbarFrontWidth = unit.health * healthbarUnitWidth,
          healthbarBackWidth = unit.maxHealth * healthbarUnitWidth

    unit.meshes.healthbarFront.scaling.x = unit.health / unit.maxHealth
    unit.meshes.healthbarFront.position.x = -(healthbarBackWidth - healthbarFrontWidth) / 2
  }

  // CREATE UNIT
  renderer.createUnit = (unit, idPlayer, idUnit) => {
    const hex = unit.hex,
          position = HEXLIB.hex2Pixel(layout, hex), // center of tile top
          cellSize = CONFIG.render3d.cellSize,
          cell = map[unit.hexOffset.col][unit.hexOffset.row],
          cellHeight = cell.height,
          tile = cell.tile
    
    unit.meshes = [] // All the parts

    // PARENT MESH
    unit.mesh = BABYLON.MeshBuilder.CreateBox(
      `unit-${idUnit}`, {height: 0.01, width: 0.01, depth: 0.01}
    )

    // Position
    unit.mesh.position = new BABYLON.Vector3(
      position.y,
      cellHeight * CONFIG.render3d.cellStepHeight,
      position.x
    )
    // Rotation
    // Same rotation as the underneath tile
    unit.mesh.rotation = tile.rotation

    // HEALTH BAR
    const healthbarWidth = unit.maxHealth * cellSize * CONFIG.render3d.healthbars.width

    // Back of the bar
    unit.meshes.healthbarBack = BABYLON.MeshBuilder.CreatePlane(
      `unit-${idUnit}-healthbar-back`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })
    unit.meshes.healthbarFront = BABYLON.MeshBuilder.CreatePlane(
      `unit-${idUnit}-healthbar-front`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })

    // Bars position 
    unit.meshes.healthbarBack.position = new BABYLON.Vector3(
      0, CONFIG.render3d.healthbars.heightAbove * cellSize, 0
    )
    unit.meshes.healthbarFront.position = new BABYLON.Vector3(
      0, 0, -0.01 // Just a bit in front of the back of the bar
    )

    // Bars parenting
    unit.meshes.healthbarBack.parent = unit.mesh
    unit.meshes.healthbarFront.parent = unit.meshes.healthbarBack

    // Bars materials
    unit.meshes.healthbarBack.material = materials['healthbarBack']
    unit.meshes.healthbarFront.material = materials['healthbarFront']

    // Billboard mode (always face the camera)
    unit.meshes.healthbarBack.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL

    renderer.updateHealthbar(unit)

    ////////////////////////////////////////
    // PARTS MESHES
    unit.meshes.push(
      ...createMultipartUnit('tank', idPlayer, idUnit, unit.mesh, cellSize, [
        {
          name: 'base',
          size: {height: 1/6, length: 3/4, width: 1/2},
          position: {x: 0, y: 1/4, z: 0},
          material: materials.unitNeutral,
          dontColorize: true
        },
        {
          name: 'trackLeft',
          size: {height: 1/3, length: 1, width: 1/4},
          position: {x: 0, y: 1/4, z: 1/3},
          material: materials.players[idPlayer][0]
        },
        {
          name: 'trackRight',
          size: {height: 1/3, length: 1, width: 1/4},
          position: {x: 0, y: 1/4, z: -1/3},
          material: materials.players[idPlayer][0]
        },
        {
          name: 'body',
          size: {height: 1/4, length: 1/4, width: 1/4},
          position: {x: 0, y: 1/2, z: 0},
          material: materials.players[idPlayer][0]
        },
        {
          name: 'cannon',
          size: {height: 1/16, length: 1/2, width: 1/16},
          position: {x: -1/4, y: 1/2, z: 0},
          material: materials.players[idPlayer][0]
        }
      ])
    )
  }

  // CREATE UNITS
  renderer.createUnits = () => {
    for (const player of game.players) {
      for (const unit of player.units) {
        renderer.createUnit(unit, player.id, unit.id)
      }
    }
  }

  // DELETE UNIT
  renderer.deleteUnit = (unit) => {
    if (unit.mesh) {
      unit.mesh.dispose()
    }
    if (unit.meshes) {
      for (const mesh of unit.meshes) {
        mesh.dispose()
      }
    }
  }

  // DELETE UNITS
  renderer.deleteUnits = () => {
    if (game.players) {
      for (const player of game.players) {
        if (player.units) {
          for (const unit of player.units) {
            renderer.deleteUnit(unit)
          }
        }
      }
    }
  }

  renderer.moveUnitOnPath = (unit, path) => {
    return new Promise(async (resolve) => {

      if (path.length === 0) {
        // The path is over
        resolve()
        return
      }

      const newPath = await moveUnitOnePathStep(unit, path)
      game.updateRenderers() // Update 2D map
      resolve(renderer.moveUnitOnPath(unit, newPath))
    })
  }

  // ATTACK UNIT
  renderer.attackUnit = (unit, ennemyUnit) => {
    // Attack animation
    // TODO: tmp, do it better (buller mesh, explosion...)
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 5, value: ennemyUnit.mesh.position },
      { frame: 10, value: unit.mesh.position }
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition]

    return scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      3 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // DESTROY UNIT
  renderer.destroyUnit = (unit) => {
    // Attack animation
    // TODO: tmp, do it better (buller mesh, explosion...)
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 10, value: new BABYLON.Vector3( // end value
        unit.mesh.position.x, // Axis inversion!
        unit.mesh.position.y - 1, // TODO: Magic value!
        unit.mesh.position.z // Axis inversion!
      )}
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition]

    return scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      0.5 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // CHANGE UNIT MATERIAL
  renderer.changeUnitMaterial = (unit, color) => {
    const materialIndex = color === 'colorDesaturated' ? 1 : 0
    for (const mesh of unit.meshes) {
      if (!mesh.dontColorize) {
        mesh.material = materials.players[unit.playerId][materialIndex]
      }
    }
  }

  ////////////////////////////////////////
  // PRIVATE
  let scene, layout, materials, shadowGenerator

  // SET EASING
  // Easing 'standard' function
  const setEasing = (animation) => {
    const easingFunction = new BABYLON.SineEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animation.setEasingFunction(easingFunction)
  }

  // CREATE MULTIPART UNIT
  const createMultipartUnit = (name, idPlayer, idUnit, parentMesh, baseSize, parts) => {
    const meshes = []
    for (const part of parts) {
      // Create box mesh
      const p = BABYLON.MeshBuilder.CreateBox(
        `player-${idPlayer}-${name}-${idUnit}-${part.name}`, 
        {
          height: baseSize * part.size.height, // height
          width: baseSize * part.size.length, // length
          depth: baseSize * part.size.width // width
        }
      )
      // Position
      p.position = new BABYLON.Vector3(
        baseSize * part.position.x,
        baseSize * part.position.y,
        baseSize * part.position.z
      )
      // Parenting
      p.parent = parentMesh
      // Material
      p.material = part.material
      // Shadows
      shadowGenerator.getShadowMap().renderList.push(p)
      p.receiveShadows = true

      if (part.dontColorize !== undefined) {
        p.dontColorize = part.dontColorize // Risky: add property to BABYLON.mesh
      }
      meshes[part.name] = p
    }
    return meshes
  }

  // ROTATE UNIT
  // Rotate a unit on itself, facing one the 6 directions
  // TODO: cleanup!
  const rotateUnit = (unit, step) => {
    const position = HEXLIB.hex2Pixel(layout, step),
          stepData = game.map.getCellFromHex(step),
          height = stepData.height * CONFIG.render3d.cellStepHeight,
          nextPosition = new BABYLON.Vector3( // end value
            position.y, // Axis inversion!
            height, 
            position.x // Axis inversion!
          )

    // Get the direction of the move
    const targetAngle = nextPosition.subtract(unit.mesh.position)
    const hypothenuse = CONFIG.render3d.cellSize * Math.sqrt(3) * 1.000001 // Avoid NaN
    let angle = Math.acos(-targetAngle.x / hypothenuse)
    if (targetAngle.z < 0) {
      angle *= -1
    }
    const deltaAngle = angle - unit.mesh.rotation.y + 0.00001
    const speed = 2 * Math.PI / Math.abs(deltaAngle)

    // ANIMATE ROTATION
    const animationPlayerRotation = new BABYLON.Animation(
      'unit.mesh',
      'rotation', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerRotation.setKeys([
      { frame: 0, value: unit.mesh.rotation },
      { frame: 10, value: new BABYLON.Vector3(0, angle, 0) }
    ])
    setEasing(animationPlayerRotation)

    unit.mesh.animations = [animationPlayerRotation]

    return scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      speed * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // MOVE UNIT
  // Move a unit to an adjacent tile
  // TODO: the rotation part seems fuxed up!?
  const moveUnit = (unit, step) => {
    const position = HEXLIB.hex2Pixel(layout, step),
          stepData = game.map.getCellFromHex(step),
          height = stepData.height * CONFIG.render3d.cellStepHeight,
          nextPosition = new BABYLON.Vector3( // end value
            position.y, // Axis inversion!
            height, 
            position.x // Axis inversion!
          ),
          nextRotation = stepData.tile.rotation

    // POSITION
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: unit.mesh.position }, 
      { frame: 10, value: nextPosition }
    ])
    setEasing(animationPlayerPosition)

    // ROTATION
    const animationPlayerRotation = new BABYLON.Animation(
      'unit.mesh',
      'rotation', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerRotation.setKeys([
      { frame: 0, value: unit.mesh.rotation }, 
      { frame: 10, value: new BABYLON.Vector3(
        nextRotation.x,
        unit.mesh.rotation.y,
        nextRotation.y
      )}
    ])
    setEasing(animationPlayerPosition)

    unit.mesh.animations = [animationPlayerPosition, animationPlayerRotation]

    return scene.beginAnimation(
      unit.mesh, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      3 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  const moveUnitOnePathStep = (unit, path) => {
    return new Promise(async (resolve) => {

      // Get the first step and remove it from the path
      const step = path.shift()
      unit.mesh.animations = []
      // Make the camera follow the moving unit
      camera.updateCameraPosition(step)
  
      // Rotate the unit in the right direction
      const rotateUnitAnimation = rotateUnit(unit, step)
      await rotateUnitAnimation.waitAsync()
      // Move the unit to the adjacent tile
      const moveUnitAnimation = moveUnit(unit, step)
      await moveUnitAnimation.waitAsync()
      // Update unit's position
      unit.moveToHex(step, CONFIG.map.mapTopped, CONFIG.map.mapParity)

      resolve(path)
    })
  }

  ////////////////////////////////////////
  // INIT
  renderer.init = (rendererScene, rendererLayout, rendererMaterials, environementShadowGenerator) => {
    scene = rendererScene
    layout = rendererLayout
    materials = rendererMaterials
    shadowGenerator = environementShadowGenerator
  }

  return renderer
}

export default Units
