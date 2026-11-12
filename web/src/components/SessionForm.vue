<script setup lang="ts">
import { ref } from "vue";
import { logout, userUid } from "../lib/auth";
import { createChatSession, UnauthorizedError } from "../lib/chat-session";

const emit = defineEmits<{
  select: [session: { uid: string; initialMessage: string | null }];
}>();

const initialMessage = ref("");
const creating = ref(false);
const error = ref<string | null>(null);

async function create(): Promise<void> {
  if (!userUid.value) return;
  creating.value = true;
  error.value = null;
  const message = initialMessage.value.trim() || null;
  try {
    const uid = await createChatSession({
      userUid: userUid.value,
      initialMessage: message,
    });
    emit("select", { uid, initialMessage: message });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      logout(`${e.message}。もう一度ログインしてください`);
      return;
    }
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="session-form">
    <header class="chat-header">
      <h1>chat-on-hono</h1>
      <span class="session-uid">{{ userUid }}</span>
      <button type="button" @click="logout()">ログアウト</button>
    </header>

    <form class="card" @submit.prevent="create">
      <h2>新しいセッション</h2>
      <label>
        初期メッセージ (任意)
        <textarea v-model="initialMessage" rows="2" />
      </label>
      <button type="submit" :disabled="creating">作成して開始</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
