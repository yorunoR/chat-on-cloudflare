<script setup lang="ts">
import { ref } from "vue";
import ChatView from "./components/ChatView.vue";
import LoginForm from "./components/LoginForm.vue";
import SessionForm from "./components/SessionForm.vue";
import { userUid } from "./lib/auth";

type Session = { uid: string; initialMessage: string | null };

const session = ref<Session | null>(null);
</script>

<template>
  <main class="app">
    <LoginForm v-if="!userUid" />
    <ChatView
      v-else-if="session"
      :key="session.uid"
      :session-uid="session.uid"
      :initial-message="session.initialMessage"
      @leave="session = null"
    />
    <SessionForm v-else @select="session = $event" />
  </main>
</template>
