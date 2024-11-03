import type {BuildOptions, LibraryFormats} from 'vite'

export type ModuleSystemOptions = Extract<LibraryFormats, 'es' | 'cjs'>

type RequiredBuildOptions = Required<BuildOptions>
export type RollupOptions = RequiredBuildOptions['rollupOptions']
