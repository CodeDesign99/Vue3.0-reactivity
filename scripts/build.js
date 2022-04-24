const fs = require('fs')
const execa = import('execa')

const dirs = fs.readdirSync('packages').filter(p => {
    if (!fs.statSync(`packages/${p}`).isDirectory()) {
        return false
    }
    return true
})

async function build(target) {
    // await execa('rollup', ['-c', '--environment', `TARGET:${target}`])
    return new Promise((resolve) => {
        execa.then(module => {
            module.execa(
                'rollup',
                ['-cw', '--environment', `TARGET:${target}`],
                { stdio: 'inherit' } // 子进程的输出需要在父进程中打印
            ).then(res => {
                resolve(res)
            })
        })
    })
}

async function runParallel(dirs, iterFn) {
    let result = []

    for (let item of dirs) {
        result.push(iterFn(item))
    }

    return Promise.all(result)
}

runParallel(dirs, build).then(() => {

})