module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '@prisma/client': '<rootDir>/src/tests/__mocks__/prisma.ts',
    'jsonwebtoken': '<rootDir>/src/tests/__mocks__/jsonwebtoken.ts',
    'openai': '<rootDir>/src/tests/__mocks__/openai.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 30000
};
