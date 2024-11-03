import {Plugin} from 'rollup'

const preventPolyfill = (): Plugin => {
  return {
    name: 'prevent-polyfill',
    renderChunk: (code, chunk) => {
      // code에 corejs가 import된 흔적이 있는지
      if (code.includes('@babel/runtime-corejs3')) {
        // 나빼고
        if (chunk.name !== 'plugins/preventPolyfill') {
          const [polyfill] = code.match(/@babel\/runtime-corejs3[^\s'"]+/) ?? []
          throw new Error(
            `\n\nyour code requires polyfill: "${polyfill}"\nfilePath: ${chunk.facadeModuleId}\n`
          )
        }
      }
    },
  }
}

export default preventPolyfill
