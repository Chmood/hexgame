import BABYLON from 'babylonjs'

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D MATERIALS

const Materials = (CONFIG_MAP, CONFIG_RENDER_3D, CONFIG_PLAYERS) => {

  const renderer = {}

  ////////////////////////////////////////
  // PUBLIC

  // CREATE MATERIALS
  renderer.createMaterials = () => {
    const materials = {}

    // TERRAINS
    for (const [name, value] of Object.entries(CONFIG_MAP.terrain)) {
      if (name !== 'ice') {
        materials[name] = createSimpleMaterial(name, value.color)
      } else {
        materials['ice'] = createSimpleMaterial(
          'ice', 
          value.color, 
          CONFIG_RENDER_3D.shinyIce, 
          false, 
          CONFIG_RENDER_3D.transparentIce ? 0.9 : 1
        )
      }
    }

    // PLAYERS
    materials.players = {}
    for (let [n, player] of Object.entries(CONFIG_PLAYERS)) {
      materials.players[n] = [] // [0] is base color, [1] is desaturated color
      materials.players[n][0] = createSimpleMaterial(`player-${n}`, player.color)
      materials.players[n][1] = createSimpleMaterial(`player-${n}`, player.colorDesaturated)
    }

    // Unit neutral parts (not colored)
    materials['unitGrey'] = createSimpleMaterial('unit-neutral', '#aaaaaa', true)
    materials['unitBlack'] = createSimpleMaterial('unit-neutral', '#333333')

    // Health bars materials
    materials['healthbarBack'] = createSimpleMaterial(
      'healthbarBack', 
      CONFIG_RENDER_3D.healthbars.colorBack, 
      false,
      true // emmissive
    )
    materials['healthbarFront'] = createSimpleMaterial(
      'healthbarFront', 
      CONFIG_RENDER_3D.healthbars.colorFront, 
      false,
      true // emmissive
    )

    // Buildings
    materials['buildingGreyLight'] = createSimpleMaterial('building-grey-light', '#aaaaaa')
    materials['buildingGreyDark'] = createSimpleMaterial('building-grey-dark', '#888888')

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
