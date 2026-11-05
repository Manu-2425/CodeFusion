// Where a device or software entry came from (backend "source" column).
// Only automatically added entries get a label; manual ones need none.

const LABELS = {
  detected: 'Detected automatically',
  extension: 'Synced by extension'
}

export function sourceLabel(source) {
  return LABELS[source] ?? null
}
