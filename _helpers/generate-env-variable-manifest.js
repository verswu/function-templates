const { parser } = require('configure-env');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_PATH = path.resolve(
  __dirname,
  '..',
  'env-variables.manifest.json'
);
const TEMPLATES_FILE = path.resolve(__dirname, '..', 'templates.json');

async function writeResult(templates) {
  const result = {
    '//': 'THIS FILE IS AUTOGENERATED. DO NOT MANIPULATE OR COMMIT',
    templates,
  };

  return fs.writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2));
}

async function getVariablesForTemplate(templateId) {
  try {
    // Look for a .env.example file first
    const envFilePath = path.resolve(__dirname, '..', templateId, '.env.example');
    const result = await parser.parseFile(envFilePath);
    return result.variables;
  }
  catch (_e) {
    // If .env.example doesn't exist, try .env
    const envFilePath = path.resolve(__dirname, '..', templateId, '.env');
    const result = await parser.parseFile(envFilePath);
    return result.variables;
  }
}

async function getTemplateIds() {
  const templatesContent = JSON.parse(
    await fs.readFile(TEMPLATES_FILE, 'utf8')
  );
  return templatesContent.templates.map((t) => t.id);
}

async function run() {
  const templates = await getTemplateIds();

  const parseFiles = templates.map(async (id) => {
    return {
      id,
      variables: await getVariablesForTemplate(id),
    };
  });

  const results = await Promise.all(parseFiles);
  const mergedResult = results.reduce((merged, current) => {
    return {
      ...merged,
      [current.id]: current.variables,
    };
  }, {});

  if (process.argv.includes('--write')) {
    await writeResult(mergedResult);
    console.log('Done');
  } else {
    console.log('Valid');
  }
}

run().catch(console.error);
