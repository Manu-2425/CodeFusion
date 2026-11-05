import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceLabel } from '../src/source.js'

test('Detected entries are labelled', () => {
  assert.equal(sourceLabel('detected'), 'Detected automatically')
})

test('Extension entries are labelled for the later sprint', () => {
  assert.equal(sourceLabel('extension'), 'Synced by extension')
})

test('Manual or missing sources have no label', () => {
  assert.equal(sourceLabel('manual'), null)
  assert.equal(sourceLabel(undefined), null)
  assert.equal(sourceLabel('something-else'), null)
})
