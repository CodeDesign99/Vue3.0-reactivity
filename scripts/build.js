const fs = require('fs')
// const execa = require('execa')
const execa = import('execa')

const dirs = fs.readdirSync('packages').filter((p) => {
    if (!fs.statSync(`packages/${p}`).isDirectory()) {
        return false
    }
    return true
})

async function build(target) {
    // await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], { stdio: 'inherit' })
    return new Promise((resolve) => {
        execa.then((module) => {
            module
                .execa(
                    'rollup',
                    ['-cw', '--environment', `TARGET:${target}`],
                    { stdio: 'inherit' } // 子进程的输出需要在父进程中打印
                )
                .then((res) => {
                    resolve(res)
                })
        })
    })
}

async function runParaller(dirs, itemFn) {
    let result = []

    for (let item of dirs) {
        result.push(itemFn(item))
    }

    return Promise.all(result)
}

runParaller(dirs, build).then(() => { })
