import { ref } from "vue";

const USER_UID_KEY = "userUid";

// API に uid を確かめるエンドポイントがないため、ログインでは保存するだけにする。
// 正しくない uid は、API が 401 を返した時点でログアウトさせる
export const userUid = ref(localStorage.getItem(USER_UID_KEY));
export const loginError = ref<string | null>(null);

export function login(uid: string): void {
  localStorage.setItem(USER_UID_KEY, uid);
  userUid.value = uid;
  loginError.value = null;
}

export function logout(error: string | null = null): void {
  localStorage.removeItem(USER_UID_KEY);
  userUid.value = null;
  loginError.value = error;
}
