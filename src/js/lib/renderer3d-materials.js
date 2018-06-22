import BABYLON from 'babylonjs'
import CONFIG from './config.js'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D MATERIALS

const Materials = () => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // CREATE MATERIALS
  renderer.createMaterials = () => {
    const materials = {}

    // TERRAINS
    for (const [name, value] of Object.entries(CONFIG.map.terrain)) {
      if (name !== 'ice') {
        materials[name] = createSimpleMaterial(name, value.color)
      } else {
        materials['ice'] = createSimpleMaterial(
          'ice', 
          value.color, 
          CONFIG.render3d.shinyIce, 
          false, 
          CONFIG.render3d.transparentIce ? 0.9 : 1
        )
      }
    }

    // PLAYERS
    materials.players = {}
    for (let [n, player] of Object.entries(CONFIG.players)) {
      materials.players[n] = [] // [0] is base color, [1] is desaturated color
      materials.players[n][0] = createSimpleMaterial(`player-${n}`, player.color)
      materials.players[n][1] = createSimpleMaterial(`player-${n}`, player.colorDesaturated)
    }

    // Unit neutral parts (not colored)
    materials['unit-neutral'] = createSimpleMaterial('unit-neutral', '#aaaaaa', true)

    // Health bars materials
    materials['healthbarBack'] = createSimpleMaterial(
      'healthbarBack', 
      CONFIG.render3d.healthbars.colorBack, 
      false,
      true // emmissive
    )
    materials['healthbarFront'] = createSimpleMaterial(
      'healthbarFront', 
      CONFIG.render3d.healthbars.colorFront, 
      false,
      true // emmissive
    )

    return materials
  }

  ////////////////////////////////////////
  // PRIVATE

  // CREATE MATERIAL
  const createSimpleMaterial = (name, color, specularity = false, emissive = false, alpha = 1) => {
    const material = new BABYLON.StandardMaterial(name)
    if (!emissive) {
      material.diffuseColor = new BABYLON.Color3.FromHexString(color)
    } else {
      // Emmissive
      material.emissiveColor = new BABYLON.Color3.FromHexString(color)
      material.diffuseColor = new BABYLON.Color3.Black()
    }

    if (!specularity) {
      material.specularColor = new BABYLON.Color3.Black()
    } else {
      material.specularColor = new BABYLON.Color3.White()
    }

    material.alpha = alpha
    material.freeze()

    return material
  }

  return renderer
}

export default Materials
