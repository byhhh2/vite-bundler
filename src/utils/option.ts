import {UserConfig, resolveConfig} from 'vite'
import {ModuleSystemOptions, RollupOptions} from '../types'
import {yellowText} from './console'

export const getRollupOutputOption = (
  formats: ModuleSystemOptions[]
): RollupOptions['output'] => {
  return formats.map((format) => ({
    dir: 'dist',
    format,
    entryFileNames: `[name].${
      {
        es: 'mjs',
        cjs: 'js',
      }[format]
    }`,
    // 개별 모듈 유지 (subpath 지원)
    preserveModules: true,
  }))
}

export const debugConfig = (config: UserConfig) => {
  console.log(yellowText('----- your vite config -----'))
  console.log(JSON.stringify(config, null, 2))

  // `configFile: false` config를 root에서 찾는 것을 방지
  resolveConfig({...config, configFile: false}, 'build').then(
    (resolvedConfig) => {
      console.log(yellowText('----- your resolved config -----'))
      console.log(JSON.stringify(resolvedConfig, null, 2))
    }
  )
}
