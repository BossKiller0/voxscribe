import Store from 'electron-store'
import { DEFAULT_SETTINGS } from '../shared/types'
import type { AppSettings } from '../shared/types'

let storeInstance: Store<AppSettings> | null = null

export function getSettingsStore(): Store<AppSettings> {
  if (!storeInstance) {
    storeInstance = new Store<AppSettings>({
      name: 'voxscribe-settings',
      defaults: DEFAULT_SETTINGS
    })
  }
  return storeInstance
}
