import path from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { useTinyEngineBaseConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((configEnv) => {
  const baseConfig = useTinyEngineBaseConfig({
    viteConfigEnv: configEnv,
    root: __dirname,
    iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/assets/')],
    useSourceAlias: false,
    envDir: './env',
    registryPath: './registry.js'
  })

  return mergeConfig(baseConfig, {
    envDir: './env',
    server: {
      host: '127.0.0.1',
      port: 8090,
      strictPort: true,
      open: false
    }
  })
})
