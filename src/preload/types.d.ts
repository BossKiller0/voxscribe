import type { VoxScribeAPI } from './index'

declare global {
  interface Window {
    voxScribeAPI: VoxScribeAPI
  }
}
