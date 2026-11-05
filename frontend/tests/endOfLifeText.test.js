import test from 'node:test'
import assert from 'node:assert/strict'
import { endOfLifeText } from '../src/endOfLifeText.js'

test('No end-of-life data shows nothing extra', () => {
  assert.equal(endOfLifeText(null), null)
})

test('End of life explains the date and what to do', () => {
  const result = endOfLifeText({ status: 'end_of_life', eolDate: '2025-10-14' })
  assert.equal(result.tone, 'bad')
  assert.match(result.text, /No longer supported since October 14, 2025/)
})

test('Outdated names the available update', () => {
  const result = endOfLifeText({ status: 'outdated', latest: '26.7' }, 'macOS')
  assert.equal(result.tone, 'warn')
  assert.equal(result.text, 'An update is available: macOS 26.7.')
})

test('Current says it is supported', () => {
  assert.equal(endOfLifeText({ status: 'current' }).text, 'Supported and up to date.')
  assert.match(
    endOfLifeText({ status: 'current', eolDate: '2027-10-12' }).text,
    /until October 12, 2027/
  )
})
