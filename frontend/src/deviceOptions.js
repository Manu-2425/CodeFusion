// Operating systems offered on the device form, with plain-language
// help for finding the version on each one (design S4, notes 3 and 4).

export const OPERATING_SYSTEMS = [
  {
    name: 'Windows',
    versionHelp: 'Start → Settings → System → About, then look for "Version".'
  },
  {
    name: 'macOS',
    versionHelp: 'Apple menu → About This Mac. The version is under the macOS name.'
  },
  {
    name: 'iOS',
    versionHelp: 'Settings → General → About, then look for "iOS Version".'
  },
  {
    name: 'iPadOS',
    versionHelp: 'Settings → General → About, then look for "iPadOS Version".'
  },
  {
    name: 'Android',
    versionHelp: 'Settings → About phone → Android version.'
  },
  {
    name: 'ChromeOS',
    versionHelp: 'Settings → About ChromeOS.'
  },
  {
    name: 'Linux',
    versionHelp: 'Settings → About, or run "cat /etc/os-release" in a terminal.'
  }
]

export function versionHelpFor(osName) {
  const os = OPERATING_SYSTEMS.find(item => item.name === osName)
  return os ? os.versionHelp : 'Check the "About" section in your device settings.'
}
