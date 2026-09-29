export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', ['feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'ci']],
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', ['api', 'web', 'docs', 'deps']],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never']
  }
};
