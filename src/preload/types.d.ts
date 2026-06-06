import type { FlowAPI } from './index'

declare global {
  interface Window {
    flowAPI: FlowAPI
  }
}
