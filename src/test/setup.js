import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { TEST_API_BASE_URL } from './fixtures.js'
import { server } from './server.js'

vi.stubEnv('VITE_API_BASE_URL', TEST_API_BASE_URL)
configure({ asyncUtilTimeout: 5000 })

let consoleErrorSpy
let consoleWarnSpy

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.useRealTimers()

  expect(consoleErrorSpy.mock.calls, 'console.error não deve ser chamado').toEqual([])
  expect(consoleWarnSpy.mock.calls, 'console.warn não deve ser chamado').toEqual([])

  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterAll(() => {
  server.close()
})
