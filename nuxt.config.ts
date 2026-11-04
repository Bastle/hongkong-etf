export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  srcDir: 'app/',
  serverDir: 'server/',

  ssr: true,

  modules: [],

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false
      }
    ]
  },

  nitro: {
    routeRules: {
      '/api/**': { cors: true }
    }
  },

  app: {
    head: {
      title: '港股热力图 - HK Stock Heatmap',
      meta: [
        { name: 'description', content: '香港股票市场热力图 - 实时监控港股涨跌' }
      ]
    }
  }
})
