// const execa = require('execa')
const execa = import('execa')

async function build(target) {
    // await execa('rollup', ['-c', '--environment', `TARGET:${target}`])
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

build('reactivity')
