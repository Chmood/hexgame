import CONFIG_TERRAIN from './map-terrain'
import HEXLIB from '../vendor/hexlib'

const CONFIG_MAP = {

  seed: 'staticmapseed', // undefined for a random seed
  // mapSize: 						{ width: 29, height: 25 }, // Logical map size, in cells
  mapSize: { width: 27, height: 27 }, // Logical map size, in cells
  // mapTopped: Math.random() > 0.5 ? HEXLIB.FLAT : HEXLIB.POINTY, // HEXLIB.FLAT or HEXLIB.POINTY
  mapTopped: HEXLIB.FLAT, // HEXLIB.FLAT or HEXLIB.POINTY
  mapParity: Math.random() > 0.5 ? HEXLIB.EVEN : HEXLIB.ODD, // HEXLIB.EVEN or HEXLIB.ODD
  // mapParity: HEXLIB.EVEN, // HEXLIB.EVEN or HEXLIB.ODD

  mapSeaMinLevel: 2, // Sea is flat below this value

  mapValueRange: {
    elevation: 12,
    moisture: 5
  },

  mapNoise: {
    elevation: {
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
    elevation: {
      invert: false,
      redistributionPower: 2, // >1 => more sea / <1 more mountains
      normalize: true, // Spread the whole height range
      islandMode: true, // All map borders are sea
      islandRedistributionPower: 0.85,
      islandMargin: 0 // numbers of ocean cells at map boundaries
    },
    moisture: {
      invert: false,
      redistributionPower: 1,
      normalize: true, // Spread the whole value range
      islandMode: false // All map borders have zero moisture (useless)
    }
  },
  terrain: CONFIG_TERRAIN
}

export default CONFIG_MAP
