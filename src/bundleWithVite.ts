import {type UserConfig as ViteConfig, mergeConfig} from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import {getBabelOutputPlugin} from '@rollup/plugin-babel'

import preventPolyfill from './plugins/preventPolyfill'
import {validateInsideSrcFolder} from './validator/entry'
import {debugConfig, getRollupOutputOption} from './utils/option'
import {DefaultModuleSystem} from './constants/default'
import {ModuleSystemOptions, RollupOptions} from './types'

export interface BundleWithViteOption {
  /** 진입점 */
  entry: string
  /** 결과물 번들 정보 (rollup) */
  output?: RollupOptions['output']
  /** 지원할 모듈 시스템 */
  formats?: ModuleSystemOptions[]
  /** vite 옵션을 재정의 */
  override?: ViteConfig
  /** 디버깅 모드 */
  debug?: boolean
}

/**
 * @remarks `entry`는 `src` 하위 파일이어야 합니다.
 * @default build.lib.formats - ['es', 'cjs']
 * @default build.rollupOptions.output - {dir: 'dist', format: build.lib.formats, entryFileNames: '[name].[extension]', preserveModules: true}
 */
const bundleWithVite = ({
  entry,
  output,
  formats = DefaultModuleSystem,
  override,
  debug = true,
}: BundleWithViteOption): ViteConfig => {
  const config: ViteConfig = {
    build: {
      target: browserslistToEsbuild(),
      // 라이브러리 모드
      lib: {
        // 진입점
        entry: validateInsideSrcFolder(entry),
      },
      rollupOptions: {
        plugins: [
          getBabelOutputPlugin({
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {corejs: {version: 3, proposals: true}},
              ],
            ],
          }),
          // 폴리필 추가 후에 검사해야 됨
          preventPolyfill(),
        ],
        // 지원하는 모듈 시스템
        output: output || getRollupOutputOption(formats),
        // node_modules를 build에서 제외
        external: (id) => /node_modules/.test(id),
      },
    },
    plugins: [],
  }

  if (debug) {
    debugConfig(config)
  }

  if (override) {
    /** mergeConfig: @see https://ko.vitejs.dev/guide/api-javascript#mergeconfig */
    return mergeConfig(config, override)
  }

  return config
}

export default bundleWithVite
