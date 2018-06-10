import HEXLIB from '../vendor/hexlib'

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const CONFIG = {
  map: {
    mapSeed: undefined, // Computed later
    // mapSize: 						{ width: 29, height: 25 }, // Logical map size, in cells
    mapSize: { width: 29, height: 25 }, // Logical map size, in cells
    // TODO: Map topping: POINTY is broken!
    mapTopped: HEXLIB.FLAT, // FLAT or POINTY
    // TODO: Map parity: EVEN is broken!
    // mapParity: 					(Math.random() < 0.5) ? EVEN : ODD, // EVEN or ODD
    mapParity: HEXLIB.ODD, // EVEN or ODD

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
        // harmonics: [0.5, 0.3, 0.2], // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
        harmonics: [0.7, 0.2, 0.1] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      }
    },
    mapPostprocess: {
      height: {
        revert: false,
        redistributionPower: 2, // >1 => more sea / <1 more mountains
        normalize: true, // Spread the whole height range
        islandMode: true, // All map borders are sea
        islandRedistributionPower: 0.85
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

      whitebeach: { color: '#ffff88' }, // 3
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
    displayTileText: false // debug tiles cost / height
  },
  render3d: {
    cellSize: 1,
    cellStepHeight: 0.5,
    randomTileSizeFactor: 0.15,
    randomTileSizeOffset: 0, // 1 => only smaller / 0.5 => smaller & bigger / 0 => only bigger
    randomTileRotationFactor: 1, // 0 : flat / 1 : sloppy / 2 : chaos
    betterOcean: false,
    shinyIce: true,
    transparentIce: false,
    postprocess: 'ssao' // 'ssao', 'multi' or 'none'
  },

  players: [
    { color: '#ff8000' }, // ORIGIN
    { color: '#ff0080' }  // DESTINATION
  ]
}

// Computed config vars
CONFIG.map.mapNoise.height.frequency =
  CONFIG.map.mapNoise.height.frequencyRatio * CONFIG.map.mapSize.width
CONFIG.map.mapNoise.moisture.frequency =
  CONFIG.map.mapNoise.moisture.frequencyRatio * CONFIG.map.mapSize.width

export default CONFIG