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
      <a-menu-item key="3">Fec&Q-Factor</a-menu-item>
    </RouterLink>
    <!-- <RouterLink to="/B2BOSNR">
      <a-menu-item key="4">B2B-OSNR</a-menu-item>
    </RouterLink> -->
  </a-menu>

  <div class="main">
    <RouterView />
  </div>
</template>
<style scoped>
/* App.vue */
.main {
  flex: 1;
  overflow: auto;
  /* 内容过多时在 .main 内部滚动 */
  width: 100%;
  /* 去掉 height: calc(...) */
}
</style>
