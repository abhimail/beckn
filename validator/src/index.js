import fs from 'node:fs/promises';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import $RefParser from 'json-schema-ref-parser';

export async function loadYamlOrJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(text);
  }
  return YAML.parse(text);
}

export async function buildSchemas({ attributesPath }) {
  const attributesDoc = await loadYamlOrJson(attributesPath);
  if (!attributesDoc || !attributesDoc.components || !attributesDoc.components.schemas) {
    throw new Error('attributes.yaml missing components.schemas');
  }

  // Build each schema independently and bundle external refs to avoid deep cycles
  const schemas = {};
  const schemasObj = attributesDoc.components.schemas;
  for (const [name, schema] of Object.entries(schemasObj)) {
    const id = `urn:schema:${name}`;
    const root = { $id: id, $schema: 'https://json-schema.org/draft/2020-12/schema', ...schema };
    // Bundle (not full dereference) and ignore circular refs to prevent stack overflow
    const bundled = await $RefParser.bundle(attributesPath, root, {
      dereference: { circular: 'ignore' },
      continueOnError: false,
    });
    schemas[name] = sanitizeSchemaExamples(bundled);
  }
  return schemas;
}

function sanitizeSchemaExamples(node) {
  if (Array.isArray(node)) {
    return node.map(sanitizeSchemaExamples);
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === 'example') {
        // Convert single example to JSON Schema-compliant examples array
        if (out.examples === undefined) out.examples = [value];
        continue;
      }
      if (key === 'examples') {
        out.examples = Array.isArray(value) ? value.map(sanitizeSchemaExamples) : [sanitizeSchemaExamples(value)];
        continue;
      }
      out[key] = sanitizeSchemaExamples(value);
    }
    return out;
  }
  return node;
}

export async function compileAjv({ schemas }) {
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    allowUnionTypes: true,
    discriminator: true,
  });
  addFormats(ajv);
  addErrors(ajv);

  for (const schema of Object.values(schemas)) {
    ajv.addSchema(schema);
  }
  return ajv;
}

export async function getValidator({ attributesPath, className }) {
  const schemas = await buildSchemas({ attributesPath });
  const ajv = await compileAjv({ schemas });
  const schema = schemas[className];
  if (!schema) {
    const available = Object.keys(schemas).join(', ');
    throw new Error(`Unknown class '${className}'. Available: ${available}`);
  }
  const validate = ajv.getSchema(schema.$id) || ajv.compile(schema);
  return validate;
}

export async function validateInstance({ attributesPath, className, instance }) {
  const validate = await getValidator({ attributesPath, className });
  const valid = validate(instance);
  return { valid, errors: validate.errors || null };
}

