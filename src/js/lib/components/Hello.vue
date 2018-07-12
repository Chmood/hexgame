<template>
  <h1>{{ message }} {{ name }}!</h1>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      message: 'Hello Vue !'
    }
  }
}
</script>