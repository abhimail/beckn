import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { loadYamlOrJson, validateInstance } from './index.js';

function parseMaybeYaml(jsonOrYamlText) {
  const t = jsonOrYamlText.trim();
  if (t.startsWith('{') || t.startsWith('[')) return JSON.parse(jsonOrYamlText);
  return YAML.parse(jsonOrYamlText);
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('validate')
    .usage('$0 --attributes <path> --class <ClassName> --data <file>')
    .option('attributes', {
      type: 'string',
      demandOption: true,
      describe: 'Path to attributes.yaml (OpenAPI 3.1 with components.schemas)'
    })
    .option('class', {
      type: 'string',
      demandOption: true,
      describe: 'Class/schema name to validate against (e.g., ChargingServiceAttributes)'
    })
    .option('data', {
      type: 'string',
      demandOption: true,
      describe: 'Path to JSON/YAML data file to validate'
    })
    .help()
    .parse();

  const attributesPath = path.resolve(argv.attributes);
  const dataPath = path.resolve(argv.data);
  const className = argv.class;

  const dataText = await fs.readFile(dataPath, 'utf8');
  const instance = parseMaybeYaml(dataText);

  const { valid, errors } = await validateInstance({ attributesPath, className, instance });
  if (valid) {
    console.log(chalk.green('✔ Valid'));
    process.exit(0);
  } else {
    console.error(chalk.red('✖ Invalid'));
    console.error(chalk.yellow(JSON.stringify(errors, null, 2)));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red(err.stack || err.message || String(err)));
  process.exit(2);
});

