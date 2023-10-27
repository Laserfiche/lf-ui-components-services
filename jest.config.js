// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

module.exports = {
  preset: 'ts-jest',
  moduleDirectories: ['node_modules', '/src', ''],
  moduleFileExtensions: ['ts', 'js'],
  reporters: ['default', 'jest-junit'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    "^.+\\.js$": "babel-jest",
  },
  testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.ts$',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    },
  },
  transformIgnorePatterns: [
    "/node_modules/?!(@laserfiche)"
  ],
  moduleNameMapper: {
    "^./(.*).js$": "./$1",
    "^../(.*).js$": "../$1",
  }
};
