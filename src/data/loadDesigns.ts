import {
  COLUMNS,
  type ColumnName,
  type DesignTable,
  type SchemaFile,
} from './columns.ts'

export function tableFromSchema(
  schema: SchemaFile,
  raw: Float32Array,
): DesignTable {
  if (raw.length !== schema.n * schema.columns.length) {
    throw new Error(`binary length ${raw.length} does not match schema`)
  }
  const columns = {} as Record<ColumnName, Float32Array>
  const meta = {} as DesignTable['meta']
  schema.columns.forEach((column, index) => {
    columns[column.name] = raw.subarray(
      index * schema.n,
      (index + 1) * schema.n,
    )
    meta[column.name] = {
      ...column,
      domain: [column.domain[0], column.domain[1]],
    }
  })
  for (const name of COLUMNS) {
    if (!columns[name]) throw new Error(`schema is missing ${name}`)
  }
  return { n: schema.n, columns, meta }
}

export async function loadDesigns(): Promise<DesignTable> {
  const [schemaRes, binaryRes] = await Promise.all([
    fetch('/data/schema.json'),
    fetch('/data/designs.f32'),
  ])
  if (!schemaRes.ok || !binaryRes.ok)
    throw new Error('failed to load design data')
  const schema = (await schemaRes.json()) as SchemaFile
  const raw = new Float32Array(await binaryRes.arrayBuffer())
  performance.mark('data-loaded')
  return tableFromSchema(schema, raw)
}
