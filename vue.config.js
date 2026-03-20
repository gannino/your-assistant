const { defineConfig } = require('@vue/cli-service');
const path = require('path');
const fs = require('fs');

// Read version from package.json
const packageJson = require('./package.json');
const appVersion = packageJson.version;

module.exports = defineConfig({
  transpileDependencies: ['openai', 'element-plus', '@element-plus/icons-vue'],
  css: {
    extract: true,
    sourceMap: false,
    loaderOptions: {
      sass: {
        additionalData: '@import "@/styles/variables.scss";',
      },
    },
  },
  publicPath:
    process.env.ELECTRON_BUILD === 'true'
      ? './'
      : process.env.NODE_ENV === 'production'
        ? '/your-assistant/' // GitHub Pages subdirectory
        : '/',

  devServer: {
    // HTTPS Configuration - Use server option instead of deprecated https
    server: process.env.VUE_APP_HTTPS === 'true' ? 'https' : 'http',

    // Other dev server options
    port: process.env.VUE_APP_PORT || 8080,
    host: '0.0.0.0',
    allowedHosts: 'all',
    historyApiFallback: true,

    // CORS and headers
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },

  configureWebpack: {
    plugins: [
      new (require('webpack')).DefinePlugin({
        'process.env.VUE_APP_VERSION': JSON.stringify(appVersion),
      }),
    ],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          include: /node_modules\/openai/,
          type: 'javascript/auto',
        },
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'pdfjs-dist/build/pdf.worker.min.js': path.resolve(
          __dirname,
          'node_modules/pdfjs-dist/build/pdf.worker.min.js'
        ),
      },
      extensionAlias: {
        '.js': ['.js', '.mjs'],
      },
      fallback: {
        module: false,
        path: false,
      },
    },
  },
  chainWebpack: config => {
    // Handle OpenAI ES modules
    config.module
      .rule('mjs')
      .test(/\.m?js$/)
      .include.add(/node_modules\/openai/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        presets: ['@vue/cli-plugin-babel/preset'],
      });
  },
});
