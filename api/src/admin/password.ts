// Workers と Node.js (スクリプト) の両方で動かすため、node:crypto ではなく Web Crypto を使う

export const PASSWORD_MIN_LENGTH = 8

const ALGORITHM = "pbkdf2_sha256"
// Workers の PBKDF2 は 100,000 回が上限
const ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_BITS = 256

const encoder = new TextEncoder()

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, ITERATIONS)
  return `${ALGORITHM}$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, rawIterations, rawSalt, rawHash] = stored.split("$")
  const iterations = Number(rawIterations)
  const salt = fromHex(rawSalt ?? "")
  const expected = fromHex(rawHash ?? "")
  if (
    algorithm !== ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > ITERATIONS ||
    !salt ||
    !expected ||
    expected.length !== KEY_BITS / 8
  ) {
    return false
  }
  const actual = await derive(password, salt, iterations)
  return timingSafeEqual(actual, expected)
}
