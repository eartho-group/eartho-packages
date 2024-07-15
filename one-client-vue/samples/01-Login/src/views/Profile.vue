<template>
  <div class="container">
    <div class="row align-items-center profile-header">
      <div class="col-md-2 mb-3">
        <img :src="user?.photoURL" alt="User's profile picture" class="rounded-circle img-fluid profile-picture" />
      </div>
      <div class="col-md text-center text-md-left">
        <h2>{{ user?.name }}</h2>
        <p class="lead text-muted">{{ user?.email }}</p>
      </div>
    </div>

    <div class="row">
      <highlightjs language="json" :code="JSON.stringify(user, null, 2)" />
    </div>
  </div>
</template>

<script lang="ts">
import { useEarthoOne } from '@eartho/one-client-vue';

export default {
  name: "profile-view",
  setup() {
    const eartho = useEarthoOne();

    return {
      user: eartho.user,
    }
  }
};
</script>
