import { atom } from 'recoil'
import { recoilPersist } from 'recoil-persist'

const { persistAtom } = recoilPersist({
  key: 'recoil-persist',
  storage: typeof window === 'undefined' ? undefined : localStorage
})

export const facingModeState = atom<string>({
  key: 'facingModeState',
  default: 'user',
  effects_UNSTABLE: [persistAtom]
})
