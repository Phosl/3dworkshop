import glsl from 'vite-plugin-glsl'
import {defineConfig} from 'vite'
const ASSET_URL = process.env.ASSET_URL || ''

export default defineConfig({
  base: `https://www.surfexplore.it/wip/wshop/`,

  plugins: [glsl()],
  server: {
    port: 3000,
  },
})
