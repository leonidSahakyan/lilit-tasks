<template>
  <MainLayout>
    <div class="home-page">
      <h1>Welcome to Task Scheduler</h1>
      <p>Please log in to access your tasks.</p>
      <router-link to="/login">
        <button class="btn-primary">Login</button>
      </router-link>
    </div>
  </MainLayout>
</template>

<script lang="ts" setup>
import MainLayout from '@/layouts/MainLayout.vue'
</script>
