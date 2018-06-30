import HEXLIB from '../vendor/hexlib'

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const CONFIG = {
  map: {
    seed: 'staticmapseed', // undefined for a random seed
    // mapSize: 						{ width: 29, height: 25 }, // Logical map size, in cells
    mapSize: { width: 27, height: 27 }, // Logical map size, in cells
    // mapTopped: Math.random() > 0.5 ? HEXLIB.FLAT : HEXLIB.POINTY, // HEXLIB.FLAT or HEXLIB.POINTY
    mapTopped: HEXLIB.FLAT, // HEXLIB.FLAT or HEXLIB.POINTY
    mapParity: Math.random() > 0.5 ? HEXLIB.EVEN : HEXLIB.ODD, // HEXLIB.EVEN or HEXLIB.ODD
    // mapParity: HEXLIB.EVEN, // HEXLIB.EVEN or HEXLIB.ODD

    mapSeaMinLevel: 2, // Sea is flat below this value
    mapValueRange: {
      height: 12,
      moisture: 5
    },
    mapNoise: {
      height: {
        stupidRandom: false,
        frequencyRatio: 0.45, // Noise base size
        frequency: undefined, // To be computed later
        harmonics: [0.5, 0.3, 0.2] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      },
      moisture: {
        stupidRandom: false,
        frequencyRatio: 0.72, // Noise base size
        frequency: undefined, // To be computed later
        harmonics: [0.7, 0.2, 0.1] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      }
    },
    mapPostprocess: {
      height: {
        revert: false,
        redistributionPower: 2, // >1 => more sea / <1 more mountains
        normalize: true, // Spread the whole height range
        islandMode: true, // All map borders are sea
        islandRedistributionPower: 0.85,
        islandMargin: 0 // numbers of ocean cells at map boundaries
      },
      moisture: {
        revert: false,
        redistributionPower: 1,
        normalize: true, // Spread the whole value range
        islandMode: false // All map borders have zero moisture (useless)
      }
    },
    terrain: {
      deepsea: { color: '#000044' }, // 0
      sea: { color: '#0000aa' }, // 1
      shore: { color: '#0011ff' }, // 2

      whitebeach: { color: '#ffffcc' }, // 3
      beach: { color: '#eeee44' }, // 3
      swamp: { color: '#666600' }, // 3

      desert: { color: '#e8c789' }, // 4
      grass: { color: '#88cc00' }, // 4 & 5
      plain: { color: '#449900' }, // 4 & 5 & 6

      forest: { color: '#006600' }, // 5 & 6 & 7
      deepforest: { color: '#003300' }, // 6 & 7
      pineforest: { color: '#194d60' }, // 6 & 7 & 8

      mountain: { color: '#aaaaaa' }, // 8
      highmountain: { color: '#666666' }, // 8

      scorched: { color: '#ddddcc' },
      snow: { color: '#ffffff' }, // 10

      ice: { color: '#ccffff' } // 11
    }
  },
  render2d: {
    cellSizeBase: undefined,	// base size of a cell in px // COMPUTED (on DOM ready)
    cellSizeRatio: 6 / 6,	// perspective cell height diminution ratio
    cellSize: undefined, // size of the cell // COMPUTED (on DOM ready)
    displayTileText: true // debug tiles cost / height
  },
  render3d: {
    // Terrain
    cellSize: 1,
    cellStepHeight: 0.5,
    randomTileSizeFactor: 0.15,
    randomTileSizeOffset: 0, // 1 => only smaller / 0.5 => smaller & bigger / 0 => only bigger
    randomTileRotation: true, // Shall we random rotate the tiles
    randomTileRotationFactor: 1, // 0 : flat / 1 : sloppy / 2 : chaos
    shinyIce: true,
    transparentIce: false,
    // Environement
    worldSize: 4096, // Used for skybox and ocean
    showAxis: false,
    betterOcean: false,
    // Render quality options
    postprocess: 'multi', // 'ssao', 'multi' or 'none'
    shadows: false,
    healthbars: {
      width: 1 / 20, // Relative to cellsize (one HP width)
      height: 1 / 5, // Relative to cellsize
      heightAbove: 2, // Relative to cellsize (vertical distance from unit)
      colorBack: '#cc4444',
      colorFront: '#44cc44'
    },
    camera: {
      distanceRatio: 1, // Size of the map / camera distance (radius)
      distanceRatioMin: 0.1,
      distanceRatioMax: 2,
      distanceRatioStep: 0.25,
      beta: Math.PI / 6, // 0 : top-down / Math.PI / 2 : side view 
      activeCamera: 'camera', // 'camera' or 'cameraFree'
      cameraFreeAutoRotate: false,
    }
  },

  players: [
    { id: 0, name: 'Foo111', isHuman: true, color: '#ff8000', colorDesaturated: '#c48444' },
    { id: 1, name: 'PlayerTwo', isHuman: false, color: '#ff0080', colorDesaturated: '#c44484' },
    { id: 2, name: 'Mr3333', isHuman: false, color: '#00ff00', colorDesaturated: '#44c444' },
    { id: 3, name: 'FourFour', isHuman: false, color: '#0080ff', colorDesaturated: '#4484c4' }
  ],

  game: {
    seed: 'staticgameseed', // undefined for a random seed
    playerStartingZoneRatio: 2, // portion of the map dedicated to player's units initial placement
    playerStartingMoney: 5000,
    moneyEarnedPerBuilding: 1000,
    animationsSpeed: 1.5,
    debounceKeyboardTime: 8, // In locksteppeded frames
    // Buildings
    buildings: {
      base: {
        number: 1, // Per player
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      city: {
        number: 3, // Per player
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      factory: {
        number: 1, // Per player
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      },
      port: {
        number: 1, // Per player
        biomes: ['shore']
      },
      airport: {
        number: 1, // Per player
        biomes: ['whitebeach', 'beach', 'swamp', 'desert', 'grass', 'plain', 'deepforest', 'pineforest', 'mountain', 'highmountain']
      }
    },
    // Units stats
    units: {
      bazooka: {
        type: 'bazooka',
        family: 'ground',
        cost: 3000,
        canConquer: true,

        maxHealth: 8,
        strength: 6,
        defense: 3,
        movement: 3,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 1,
          deepforest: 1,
          pineforest: 1,

          mountain: 1,
          highmountain: 1,
    
          scorched: 2,
          snow: 2,
    
          ice: 3
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      jeep: {
        type: 'jeep',
        family: 'ground',
        cost: 4000,
        canConquer: false,

        maxHealth: 12,
        strength: 8,
        defense: 4,
        movement: 6,
        attackRangeMax: 1,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 1,
    
          desert: 1,
          grass: 1,
          plain: 1,
    
          forest: 2,
          deepforest: 2,
          pineforest: 2
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      tank: {
        type: 'tank',
        family: 'ground',
        cost: 7000,
        canConquer: false,
        // level: 1,

        // See: http://fireemblem.wikia.com/wiki/Category:Stats
        maxHealth: 20, // http://fireemblem.wikia.com/wiki/HP
        strength: 10, // http://fireemblem.wikia.com/wiki/Strength
        // magic: 5, // http://fireemblem.wikia.com/wiki/Magic_(stat)
        // skill: 7, // http://fireemblem.wikia.com/wiki/Skill_(stat)
        // speed: 8, // http://fireemblem.wikia.com/wiki/Speed_(stat)
        // luck: 6, // http://fireemblem.wikia.com/wiki/Luck
        defense: 5, // http://fireemblem.wikia.com/wiki/Defense_(stat)
        // resistance: 3, // http://fireemblem.wikia.com/wiki/Resistance
        movement: 4, // http://fireemblem.wikia.com/wiki/Movement

        // attackRangeMin: 1, // Not used by now
        attackRangeMax: 2,

        biomesMoveCosts: {
          whitebeach: 1,
          beach: 1,
          swamp: 2,
    
          desert: 1,
          grass: 1,
          plain: 1
        },
        buildingsMoveCosts: {base: 0.5, city: 0.5, factory: 0.5, port: 0.5, airport: 0.5}
      },
      boat: {
        type: 'boat',
        family: 'sea',
        cost: 10000,
        canConquer: false,

        maxHealth: 15,
        strength: 9,
        defense: 5,
        movement: 5,
        attackRangeMax: 3,

        biomesMoveCosts: {
          deepsea: 0.5,
          sea: 0.75,
          shore: 1
        },
        buildingsMoveCosts: {port: 0.5}
      },
      bomber: {
        type: 'bomber',
        family: 'air',
        cost: 15000,
        canConquer: false,

        maxHealth: 20,
        strength: 10,
        defense: 7,
        movement: 7,
        attackRangeMax: 1,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      },
      fighter: {
        type: 'fighter',
        family: 'air',
        cost: 12000,
        canConquer: false,

        maxHealth: 15,
        strength: 7,
        defense: 6,
        movement: 10,
        attackRangeMax: 2,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      },
      helicopter: {
        type: 'helicopter',
        family: 'air',
        cost: 6000,
        canConquer: false,

        maxHealth: 12,
        strength: 7,
        defense: 5,
        movement: 5,
        attackRangeMax: 1,

        biomesMoveCosts: {
          // Air unit: all biomes, cost is always 1
          deepsea: 1, sea: 1, shore: 1, whitebeach: 1, beach: 1, swamp: 1, desert: 1, grass: 1, plain: 1, forest: 1, deepforest: 1, pineforest: 1, mountain: 1, highmountain: 1, scorched: 1, snow: 1, ice: 1
        },
        buildingsMoveCosts: {base: 1, city: 1, factory: 1, port: 1, airport: 1}
      }
    }
  }
}

// Computed config vars
CONFIG.map.mapNoise.height.frequency =
  CONFIG.map.mapNoise.height.frequencyRatio * CONFIG.map.mapSize.width
CONFIG.map.mapNoise.moisture.frequency =
  CONFIG.map.mapNoise.moisture.frequencyRatio * CONFIG.map.mapSize.width

export default CONFIG