<template>
    <v-container fluid class="full-parent-height d-flex">
        <router-view></router-view>
    </v-container>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class Performance extends Vue {

}

</script>

<style scoped>

</style>