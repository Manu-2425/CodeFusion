import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canDetect,
  detectThisComputer,
  mapPlatform,
  pickBrowser,
  suggestedName
} from '../src/detectDevice.js'

// A fake browser (stub) that reports the given client hints.
function fakeNavigator({ platform, platformVersion, fullVersionList = [], mobile = false }) {
  return {
    userAgentData: {
      mobile,
      async getHighEntropyValues() {
        return { platform, platformVersion, fullVersionList }
      }
    }
  }
}

const chromeBrands = [
  { brand: 'Not)A;Brand', version: '99.0.0.0' },
  { brand: 'Chromium', version: '141.0.7390.55' },
  { brand: 'Google Chrome', version: '141.0.7390.55' }
]

test('macOS version is passed through, with trailing .0 removed', () => {
  assert.deepEqual(mapPlatform('macOS', '15.3.1'), { os_name: 'macOS', os_version: '15.3.1' })
  assert.deepEqual(mapPlatform('macOS', '26.0.0'), { os_name: 'macOS', os_version: '26.0' })
})

test('Windows 11 starts at platformVersion 13 (boundary)', () => {
  assert.equal(mapPlatform('Windows', '12.0.0').os_version, '10')
  assert.equal(mapPlatform('Windows', '13.0.0').os_version, '11')
  assert.equal(mapPlatform('Windows', '19.0.0').os_version, '11')
  assert.equal(mapPlatform('Windows', '1.0.0').os_version, '10')
  assert.equal(mapPlatform('Windows', '0.3.0').os_version, '')
})

test('Android, ChromeOS and Linux map to the form’s OS list', () => {
  assert.deepEqual(mapPlatform('Android', '14.0.0'), { os_name: 'Android', os_version: '14' })
  assert.deepEqual(mapPlatform('Chrome OS', '16093.68.0'), { os_name: 'ChromeOS', os_version: '16093.68' })
  assert.deepEqual(mapPlatform('Linux', ''), { os_name: 'Linux', os_version: '' })
})

test('Unknown platforms are not guessed', () => {
  assert.equal(mapPlatform('Fuchsia', '1.0'), null)
  assert.equal(mapPlatform('', ''), null)
})

test('The real browser is picked, not the placeholder brand', () => {
  assert.deepEqual(pickBrowser(chromeBrands), { name: 'Google Chrome', version: '141.0.7390.55' })
  assert.deepEqual(
    pickBrowser([{ brand: 'Chromium', version: '141.0' }, { brand: 'Microsoft Edge', version: '141.0.3537.71' }]),
    { name: 'Microsoft Edge', version: '141.0.3537.71' }
  )
  assert.deepEqual(pickBrowser([{ brand: 'Chromium', version: '141.0' }]), { name: 'Chromium', version: '141.0' })
  assert.equal(pickBrowser([]), null)
})

test('Detection fills OS, device type and browser in Chrome on a Mac', async () => {
  const result = await detectThisComputer(
    fakeNavigator({ platform: 'macOS', platformVersion: '26.6.2', fullVersionList: chromeBrands })
  )
  assert.deepEqual(result, {
    os_name: 'macOS',
    os_version: '26.6.2',
    device_type: 'Laptop/Desktop',
    browser: { name: 'Google Chrome', version: '141.0.7390.55' }
  })
})

test('A mobile browser is detected as a phone', async () => {
  const result = await detectThisComputer(
    fakeNavigator({ platform: 'Android', platformVersion: '14.0.0', fullVersionList: chromeBrands, mobile: true })
  )
  assert.equal(result.device_type, 'Phone')
})

test('Safari and Firefox get a clear manual-entry message', async () => {
  assert.equal(canDetect({}), false)
  await assert.rejects(detectThisComputer({}), /fill them in below/)
})

test('Suggested names follow the operating system', () => {
  assert.equal(suggestedName('macOS'), 'My Mac')
  assert.equal(suggestedName('Windows'), 'My Windows PC')
  assert.equal(suggestedName('Linux'), 'My computer')
})
