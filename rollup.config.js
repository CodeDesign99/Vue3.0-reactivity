import ts from 'rollup-plugin-typescript2' //解析ts插件
import resolvePlugin from '@rollup/plugin-node-resolve' // 解析第三方插件
import path from 'path'

// 获取packages目录
let packagesDir = path.resolve(__dirname, 'packages')
let packageDir = path.resolve(packagesDir, process.env.TARGET)

// 获取这个路径下的package.json
const resolve = p => path.resolve(packageDir, p)
// 引入package.json
const packageJson = require(resolve('package.json'))

const packageOptions = packageJson.buildOptions
const name = path.basename(packageDir) // 获取这个目录的最后一个名字

const outputConfig = {
    'esm-bundler': {
        file: resolve(`dist/${name}.esm-bundler.js`),
        format: 'es'
    },
    'cjs': {
        file: resolve(`dist/${name}.cjs.js`),
        format: 'cjs'
    },
    'global': {
        file: resolve(`dist/${name}.global.js`),
        format: 'iife'
    }
}

function createConfig(format, output) {
    output.name = packageOptions.name
    output.sourcemap = true
    return {
        input: resolve('src/index.ts'), // 打包入口
        output,
        plugins: [
            ts({ // ts 编译的时候用的文件是哪一个
                tsconfig: path.resolve(__dirname, 'tsconfig.json')
            }),
            resolvePlugin()
        ]
    }
}
// 根据用户提供的formats选项 去我们自己的配置里取值进行生成配置文件
export default packageOptions.formats.map(format => createConfig(format, outputConfig[format]))