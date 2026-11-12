<script setup lang="ts">
import { ref } from "vue";
import { login, loginError } from "../lib/auth";

const uid = ref("");

function submit(): void {
  const value = uid.value.trim();
  if (value) login(value);
}
</script>

<template>
  <div class="session-form">
    <h1>chat-on-hono</h1>

    <form class="card" @submit.prevent="submit">
      <h2>ログイン</h2>
      <label>
        ユーザー UID
        <input v-model="uid" required autofocus placeholder="users.uid" />
      </label>
      <button type="submit">ログイン</button>
      <p v-if="loginError" class="error">{{ loginError }}</p>
    </form>
  </div>
</template>
