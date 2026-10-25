module.exports = {
  disableEmoji: false,
  format: "{emoji}{type}: {subject}",
  list: [
    "fix",
    "feat",
    "refactor",
    "test",
    "style",
    "chore",
    "docs",
  ],
  maxMessageLength: 80,
  minMessageLength: 3,
  questions: ["type", "subject", "body"],
  scopes: [],
  types: {
    chore: {
      description: "Build process or auxiliary tool changes",
      emoji: '🤖',
      value: "chore",
    },
    docs: {
      description: 'Documentation only changes',
      emoji: '✏️ ',
      value: 'docs'
    },
    feat: {
      description: "A new feature",
      emoji: '🎸',
      value: "feat",
    },
    fix: {
      description: "A bug fix",
      emoji: '🐛',
      value: "fix",
    },
    refactor: {
      description: "A code change that neither fixes a bug or adds a feature",
      emoji: '💡',
      value: "refactor",
    },
    style: {
      description: 'Design, markup, white-space, formatting, missing semi-colons...',
      emoji: '💄',
      value: 'style',
    },
    test: {
      description: 'Adding missing tests',
      emoji: '💍',
      value: 'test',
    },
  },
};
