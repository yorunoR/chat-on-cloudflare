<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useChat } from "../lib/use-chat";

const props = defineProps<{
  sessionUid: string;
  initialMessage: string | null;
}>();
defineEmits<{ leave: [] }>();

const { entries, sending, error, send } = useChat(
  props.sessionUid,
  props.initialMessage,
);
const input = ref("");
const list = ref<HTMLElement | null>(null);

function submit(): void {
  const text = input.value.trim();
  if (!text || sending.value) return;
  input.value = "";
  send(text);
}

// IME の変換確定の Enter では送らない
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    submit();
  }
}

watch(
  entries,
  async () => {
    await nextTick();
    list.value?.scrollTo({ top: list.value.scrollHeight });
  },
  { deep: true },
);
</script>

<template>
  <div class="chat">
    <header class="chat-header">
      <span class="session-uid">{{ sessionUid }}</span>
      <button type="button" @click="$emit('leave')">新しいセッション</button>
    </header>

    <ul ref="list" class="entries">
      <li
        v-for="(entry, i) in entries"
        :key="i"
        :class="['entry', entry.role]"
      >
        <span v-if="entry.agent" class="agent">{{ entry.agent }}</span>
        <p class="content">
          {{ entry.content }}<span v-if="entry.streaming" class="cursor">▍</span>
        </p>
      </li>
    </ul>

    <p v-if="error" class="error">{{ error }}</p>

    <form class="composer" @submit.prevent="submit">
      <textarea
        v-model="input"
        rows="2"
        placeholder="メッセージ (Enter で送信、Shift+Enter で改行)"
        @keydown="onKeydown"
      />
      <button type="submit" :disabled="sending || !input.trim()">送信</button>
    </form>
  </div>
</template>
