import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import livereload from 'rollup-plugin-livereload';
import visualizer from 'rollup-plugin-visualizer';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import replace from '@rollup/plugin-replace';
import analyze from 'rollup-plugin-analyzer';
import dev from 'rollup-plugin-dev';
import vue from 'rollup-plugin-vue';
import { createApp } from './scripts/oidc-provider';
import pkg from './package.json';

const EXPORT_NAME = 'vueEartho';

const isProduction = process.env.NODE_ENV === 'production';
const shouldGenerateStats = process.env.WITH_STATS === 'true';
const defaultDevPort = 3000;
const serverPort = process.env.DEV_PORT || defaultDevPort;

const visualizerOptions = {
  filename: 'bundle-stats/index.html'
};

const getPlugins = shouldMinify => {
  return [
    webWorkerLoader({
      targetPlatform: 'browser',
      sourceMap: !isProduction,
      preserveSource: !isProduction,
      pattern: /^(?!(?:[a-zA-Z]:)|\/).+\.worker\.ts$/
    }),
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        noEmit: false,
        sourceMap: true,
        compilerOptions: {
          lib: ['dom', 'es6']
        }
      }
    }),
    replace({
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
      preventAssignment: true
    }),
    shouldMinify && terser(),
    sourcemaps()
  ];
};

const getStatsPlugins = () => {
  if (!shouldGenerateStats) return [];
  return [visualizer(visualizerOptions), analyze({ summaryOnly: true })];
};

const footer = `('EarthoOne' in this) && this.console && this.console.warn && this.console.warn('EarthoOne already declared on the global namespace');
this && this.${EXPORT_NAME} && (this.EarthoOne = this.EarthoOne || this.${EXPORT_NAME}.EarthoOne);`;

let bundles = [
  {
    input: 'src/index.cjs.ts',
    output: {
      name: EXPORT_NAME,
      file: 'dist/one-client-vue.development.js',
      footer,
      format: 'umd',
      sourcemap: true,
      exports: 'default',
      globals: {
        vue: 'Vue',
        'vue-router': 'VueRouter'
      }
    },
    external: ['vue', 'vue-router'],
    plugins: [
      ...getPlugins(false),
      !isProduction &&
      dev({
        dirs: ['dist', 'static', 'node_modules/vue/dist', 'playground'],
        port: serverPort,
        extend(app, modules) {
          app.use(modules.mount(createApp({ port: serverPort })));
        }
      }),
      !isProduction && livereload()
    ],
    watch: {
      clearScreen: false
    },
    external: ['vue', 'vue-router']
  }
];

if (isProduction) {
  bundles = bundles.concat(
    {
      input: 'src/index.cjs.ts',
      output: [
        {
          name: EXPORT_NAME,
          file: 'dist/one-client-vue.production.js',
          footer,
          format: 'umd',
          exports: 'default',
          globals: {
            vue: 'Vue',
            'vue-router': 'VueRouter'
          }
        }
      ],
      external: ['vue', 'vue-router'],
      plugins: [...getPlugins(isProduction), ...getStatsPlugins()]
    },
    {
      input: 'src/index.ts',
      output: [
        {
          file: pkg.module,
          format: 'esm'
        }
      ],
      external: ['vue', 'vue-router'],
      plugins: getPlugins(isProduction)
    },
    {
      input: 'src/index.cjs.ts',
      output: [
        {
          name: EXPORT_NAME,
          file: pkg.main,
          format: 'cjs',
          exports: 'default'
        }
      ],
      plugins: getPlugins(false),
      external: Object.keys(pkg.dependencies)
    }
  );
} else {
  bundles = bundles.concat({
    input: 'playground/index.ts',
    output: {
      format: 'umd',
      file: 'dist/one-client-vue.playground.js',
      globals: {
        vue: 'Vue',
        'vue-router': 'VueRouter'
      }
    },
    external: ['vue', 'vue-router'],
    plugins: [vue(), ...getPlugins(false)]
  });
}
export default bundles;
