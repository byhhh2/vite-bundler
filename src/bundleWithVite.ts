import {type UserConfig as ViteConfig, mergeConfig} from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import {babel} from '@rollup/plugin-babel'

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
          babel({
            babelHelpers: 'runtime',
            plugins: [
              /**
               * @see https://babeljs.io/docs/babel-plugin-transform-runtime
               * - helper, polyfill을 삽입하는 역할
               * - .browserslistrc를 읽는 기능이 없다.
               */
              ['@babel/plugin-transform-runtime'],
              /**
               * @see https://www.npmjs.com/package/babel-plugin-polyfill-corejs3
               * - 폴리필 자동 추가, core-js3 기반으로 동작
               * - core-js 버전 major, minor, patch 지정 가능
               * - target 환경에 따라 폴리필 결정 (target이 설정되어 있지 않다면 .browserslistrc 읽음)
               * - core-js pure 버전 지원
               */
              [
                'babel-plugin-polyfill-corejs3',
                {
                  // .browserslistrc 읽기
                  target: undefined,
                  /** @see https://github.com/babel/babel-polyfills/blob/HEAD/docs/usage.md#method */
                  method: 'usage-pure',
                  version: '3.39.0',
                  proposals: true,
                  shouldInjectPolyfill: (
                    name: string,
                    defaultShouldInject: boolean
                  ) => {
                    if (defaultShouldInject) {
                      throw new Error(`${name} 폴리필이 필요합니다.`)
                    }

                    return defaultShouldInject
                  },
                },
              ],
            ],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            exclude: /node_modules/,
          }),
          // 폴리필 추가 후에 검사해야 됨
          preventPolyfill(),
        ],
        // 지원하는 모듈 시스템
        output: output || getRollupOutputOption(formats),
        // node_modules를 build에서 제외
        external: (id) => /node_modules/.test(id) || /core-js-pure/.test(id),
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
