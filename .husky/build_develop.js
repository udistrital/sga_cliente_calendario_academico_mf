const simpleGit = require('simple-git');
const { exec } = require('child_process');
const path = require('path');

const git = simpleGit();

async function prePush() {
    const branchSummary = await git.branchLocal();
    const currentBranch = branchSummary.current;
    try {

        if (currentBranch === 'develop') {
            console.log('En develop, no se necesita verificar build para este caso');
            return;
        }

        console.log(`\nObteniendo actualización de develop...`);
        await git.fetch('origin', 'develop');

        console.log(`Moviendo a rama temporal para merge...`);
        await git.checkoutLocalBranch('rama_temporal').catch(async () => {
            await git.deleteLocalBranch('rama_temporal', true);
            await git.checkoutLocalBranch('rama_temporal');
        });

        console.log(`Haciendo merge en rama temporal...`);
        await git.mergeFromTo('origin/develop', currentBranch, { '--no-ff': null });

        console.log(`Instalando dependencias...`);
        await runCommand('npm install');

        console.log(`Comprobando compilación...`);
        await runCommand('npm run build');

        console.log(`Volviendo a rama de desarrollo...`);
        await git.checkout(currentBranch);
        await git.deleteLocalBranch('rama_temporal', true);

        console.log('Pre-commit pasó exitosamente.');
    } catch (err) {
        console.error('Pre-commit falló por:', err.message);
        console.log(`Volviendo a rama de desarrollo...`);
        await git.checkout(currentBranch).catch(async () => {
            await git.reset('hard');
            await git.checkout(currentBranch);
            await git.mergeFromTo('origin/develop', currentBranch, { '--no-ff': null });
        });
        await git.deleteLocalBranch('rama_temporal', true);
        process.exit(1);
    }
}

function runCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: path.resolve(__dirname, '..') }, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return reject(new Error(`Comando "${cmd}" falló con código ${err.code}`));
            }
            console.log(stdout);
            resolve();
        });
    });
}

prePush();
