<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

function IsResultWindow() {
  return !window.location.href.includes("CommanderResult");
}


</script>

<template>

  <!-- End Navbar with Topbar-->
  <a-menu mode="horizontal" theme="light" :default-selected-keys="['1']" v-if="IsResultWindow()">
    <RouterLink to="/">
      <a-menu-item key="1">Link</a-menu-item>
    </RouterLink>
    <RouterLink to="/Commander">
      <a-menu-item key="2">Commander</a-menu-item>
    </RouterLink>
    <RouterLink to="/Fec2Q">
      <a-menu-item key="3">FEC</a-menu-item>
    </RouterLink>
  </a-menu>

  <div class="main">
    <RouterView />
  </div>
</template>
<style scoped>
.main {
  height: calc(100% - 58px);
  width: 100%;
}
</style>
