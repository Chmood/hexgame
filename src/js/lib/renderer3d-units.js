import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib'
import CONFIG from './config'
import unitsParts from './renderer3d-unitsparts'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D UNITS

const Units = (game, map, camera) => {
  
  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // UPDATE HEALTH BAR
  renderer.updateHealthbar = (unit, noAnimationMode = false) => {
    const healthbarBaseWidth = CONFIG.render3d.cellSize * CONFIG.render3d.healthbars.width,
          healthbarFrontWidth = unit.health * healthbarBaseWidth,
          healthbarBackWidth = unit.maxHealth * healthbarBaseWidth,
          healthbar = unit.meshes.healthbarFront, // shortcut
          finalScalingX = unit.health / unit.maxHealth,
          finalPositionX = -(healthbarBackWidth - healthbarFrontWidth) / 2 

    if (noAnimationMode) {
      healthbar.scaling.x = finalScalingX
      healthbar.position.x = finalPositionX
      return
    }

    // Scaling animation
    const animationHealthbarScaling = new BABYLON.Animation(
      'animationHealthbarScalingX', // Animation name
      'scaling.x', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationHealthbarScaling.setKeys([
      { frame: 0, value: healthbar.scaling.x }, 
      { frame: 10, value: finalScalingX }
    ])
    setEasing(animationHealthbarScaling)

    // Position animation
    const animationHealthbarPosition = new BABYLON.Animation(
      'animationHealthbarPositionX', // Animation name
      'position.x', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationHealthbarPosition.setKeys([
      { frame: 0, value: healthbar.position.x }, 
      { frame: 10, value: finalPositionX}
    ])
    setEasing(animationHealthbarPosition)

    healthbar.animations = [
      animationHealthbarScaling, 
      animationHealthbarPosition
    ]

    return scene.beginAnimation(
      healthbar, // Target
      0, // Start frame
      10, // End frame
      false, // Loop (according to ANIMATIONLOOPMODE)
      1 * CONFIG.game.animationsSpeed // Speed ratio
    )
  }

  // CREATE UNIT
  renderer.createUnit = (unit, idPlayer, idUnit) => {
    const unitPositionAndRotation = getUnitPositionAndRotationOnHex(unit, unit.hex)

    unit.meshes = {} // All the parts but the parent

    ////////////////////////////////////////
    // PARENT MESH
    unit.mesh = BABYLON.MeshBuilder.CreateBox(
      `unit-${idUnit}`, {height: 0.01, width: 0.01, depth: 0.01}
    )
    unit.mesh.isPickable = false
    // Position
    unit.mesh.position = unitPositionAndRotation.position
    // Rotation
    unit.mesh.rotation = unitPositionAndRotation.rotation

    ////////////////////////////////////////
    // HEALTH BAR
    const cellSize = CONFIG.render3d.cellSize

    const healthbar = createHealthbar(unit, cellSize)
    unit.meshes.healthbarBack = healthbar.back
    unit.meshes.healthbarFront = healthbar.front

    renderer.updateHealthbar(unit, true) // Set healthbar without animation

    ////////////////////////////////////////
    // PARTS MESHES
    const parts = createMultipartUnit(
      unit.name, 
      idPlayer, 
      idUnit, 
      unit.mesh, 
      cellSize, 
      unitsParts[unit.type]
    )
    for (const part of parts) {
      unit.meshes[part.name] = part.mesh
    }

    if (unit.hasPlayed) {
      renderer.changeUnitMaterial(unit, 'colorDesaturated')
    }
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
      for (const part in unit.meshes) {
        unit.meshes[part].dispose()
      }
    }
  }

  // DELETE UNITS
  renderer.deleteUnits = (optionalPlayer = false) => {
    if (game.players) {
      for (const player of game.players) {
        if (!optionalPlayer || (optionalPlayer && player === optionalPlayer)) {
          if (player.units) {
            for (const unit of player.units) {
              renderer.deleteUnit(unit)
            }
          }
        }
      }
    }
  }

  // MOVE UNIT ON PATH
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

  // TELEPORT UNIT
  renderer.teleportUnit = (unit, hex, orientation = 0) => {
    return new Promise(async (resolve) => {

      const moveUnitAnimation = moveUnit(unit, hex)
      await moveUnitAnimation.waitAsync()
      // Update unit's position
      unit.moveToHex(hex, CONFIG.map.mapTopped, CONFIG.map.mapParity)
      resolve()
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

  // BUILD UNIT
  renderer.buildUnit = (unit) => {
    // Build animation
    const animationPlayerPosition = new BABYLON.Animation(
      'unit.mesh',
      'position', 
      10, 
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    animationPlayerPosition.setKeys([
      { frame: 0, value: new BABYLON.Vector3( // end value
        unit.mesh.position.x, // Axis inversion!
        unit.mesh.position.y - 1, // TODO: Magic value!
        unit.mesh.position.z // Axis inversion!
      )},
      { frame: 10, value: unit.mesh.position }
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
  
    for (const part in unit.meshes) {
      const mesh = unit.meshes[part]

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
      // Rotation
      if (part.rotation) {
        p.rotation = new BABYLON.Vector3(
          part.rotation.x * 2 * Math.PI,
          part.rotation.y * 2 * Math.PI,
          part.rotation.z * 2 * Math.PI,
        )
      }

      // Parenting
      p.parent = parentMesh
      // Material
      if (part.material === 'player') {
        p.material = materials.players[idPlayer][0]
      } else {
        p.material = materials[part.material]
        p.dontColorize = true // Risky: add property to BABYLON.mesh
      }
      // Shadows
      if (CONFIG.render3d.shadows) {
        shadowGenerator.getShadowMap().renderList.push(p)
        p.receiveShadows = true
      }
      // Pickability
      p.isPickable = false

      meshes.push({
        name: part.name,
        mesh: p
      })
    }
    return meshes
  }

  // CREATE HEALTHBAR
  const createHealthbar = (unit, cellSize) => {
    const healthbarWidth = unit.maxHealth * cellSize * CONFIG.render3d.healthbars.width

    // Back and front of the bar
    const healthbarBack = BABYLON.MeshBuilder.CreatePlane(
      `unit-${unit.id}-healthbar-back`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })
    const healthbarFront = BABYLON.MeshBuilder.CreatePlane(
      `unit-${unit.id}-healthbar-front`, 
      { width: healthbarWidth, height: cellSize * CONFIG.render3d.healthbars.height })

    // Do not pick them
    healthbarBack.isPickable = false
    healthbarFront.isPickable = false

    // Bars position 
    healthbarBack.position = new BABYLON.Vector3(
      0, CONFIG.render3d.healthbars.heightAbove * cellSize, 0
    )
    healthbarFront.position = new BABYLON.Vector3(
      0, 0, -0.01 // Just a bit in front of the back of the bar
    )

    // Bars parenting
    healthbarBack.parent = unit.mesh
    healthbarFront.parent = healthbarBack

    // Bars materials
    healthbarBack.material = materials['healthbarBack']
    healthbarFront.material = materials['healthbarFront']

    // Don't colorize
    healthbarBack.dontColorize = true
    healthbarFront.dontColorize = true

    // Billboard mode (always face the camera)
    healthbarBack.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL

    return {
      back: healthbarBack,
      front: healthbarFront
    }
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

  // GET UNIT POSITION AND ROTATION ON HEX
  const getUnitPositionAndRotationOnHex = (unit, hex) => {
    const hexPosition = HEXLIB.hex2Pixel(layout, hex),
          cell = game.map.getCellFromHex(hex),
          height = cell.height,
          // Only ground units follow terrain slope
          doFollowTerrainSlope = unit.family === 'ground' ? true : false

    let cellHeight, direction

    // HEIGHT
    if (unit.family === 'ground') {
      // Ground units use the terrain height
      cellHeight = height

    } else if (unit.family === 'sea') {
      // Naval units use the ocean surface height
      cellHeight = CONFIG.map.mapSeaMinLevel + 1

    } else if (unit.family === 'air') {
      // Air units use maximum height (not very legible on the 3D map)
      // cellHeight = CONFIG.map.mapValueRange.height + 1
      // Air units fly from a distance above the ground
      if (height < CONFIG.map.mapSeaMinLevel + 1) {
        // Fly above the sea
        cellHeight = CONFIG.map.mapSeaMinLevel + 1 + 3
      } else {
        // Fly above the ground
        cellHeight = height + 3
      }
    }

    cellHeight *= CONFIG.render3d.cellStepHeight

    // DIRECTION
    if (unit.mesh) {
      direction = unit.mesh.rotation.y
    } else {
      // Random direction
      if (CONFIG.map.mapTopped === HEXLIB.FLAT) {
        direction = (Math.floor(Math.random() * 6) * 2 * Math.PI / 6)
      } else {
        direction = (Math.floor(Math.random() * 6) * 2 * Math.PI / 6) + (2 * Math.PI / 12)
      }
    }

    // POSITION
    const position = new BABYLON.Vector3( // end value
      hexPosition.y, // Axis inversion!
      cellHeight, 
      hexPosition.x // Axis inversion!
    )

    // ROTATION
    // TODO: fucked up applied terrain rotation!!!
    const rotation = doFollowTerrainSlope ? new BABYLON.Vector3(
      cell.tile.rotation.x,
      direction, // Keep the unit direction/orientation (Y axis) if it exists
      cell.tile.rotation.y
    ) : new BABYLON.Vector3(
      0,
      direction, // Keep the unit direction/orientation (Y axis) if it exists
      0
    )

    return {position, rotation}
  }

  // MOVE UNIT
  // Move a unit to an adjacent tile
  // TODO: the rotation part seems fuxed up!?
  const moveUnit = (unit, step) => {
    const stepPositionAndRotation = getUnitPositionAndRotationOnHex(unit, step)

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
      { frame: 10, value: stepPositionAndRotation.position }
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
      { frame: 10, value: stepPositionAndRotation.rotation }
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
