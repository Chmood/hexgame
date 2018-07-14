// initial state
const state = {
  isActive: false,

  currentGameMenuItems: [],
  currentGameMenuItemId: 0,
  currentGameMenuItemElement: null
}

// getters
const getters = {
  getCurrentGameMenuItemElement: (state) => state.currentGameMenuItemElement
}

// actions
const actions = {
  // checkout ({ commit, state }, products) {
  //   const savedCartItems = [...state.items]
  //   commit('setCheckoutStatus', null)
  //   // empty cart
  //   commit('setCartItems', { items: [] })
  //   shop.buyProducts(
  //     products,
  //     () => commit('setCheckoutStatus', 'successful'),
  //     () => {
  //       commit('setCheckoutStatus', 'failed')
  //       // rollback to the cart saved before sending the request
  //       commit('setCartItems', { items: savedCartItems })
  //     }
  //   )
  // }
}

// mutations
const mutations = {
  setActive (state, { active }) {
    state.isActive = active
  },

  clear (state ) {
    state.currentGameMenuItems = []
    state.currentGameMenuItemId = 0
  },

  setItems (state, { items }) {
    state.currentGameMenuItems = items
  },

  move (state, { direction }) {
    const increment = direction === 'up' ? -1 : 1
    let currentGameMenuItemId = state.currentGameMenuItemId + increment

    // Wrap index
    if (currentGameMenuItemId < 0) {
      currentGameMenuItemId += state.currentGameMenuItems.length
    } else if (currentGameMenuItemId >= state.currentGameMenuItems.length) {
      currentGameMenuItemId -= state.currentGameMenuItems.length
    }
    state.currentGameMenuItemId = currentGameMenuItemId
  },

  setCurrentGameMenuItemElement (state, { element }) {
    state.currentGameMenuItemElement = element
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}