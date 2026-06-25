import { type IsoTimestamp } from "../domain/common.ts";
import { type DocumentArtifact, type DocumentPort, type DocumentSpec } from "./ports.ts";

/**
 * Reference {@link DocumentPort} implementation that renders `{{variable}}`
 * placeholders from a template string. It is intended for tests and local
 * development; a production adapter would delegate to CMDB-DocKit.
 *
 * The clock is injected so generation is deterministic and side-effect free.
 */
export class InMemoryDocumentAdapter implements DocumentPort {
  readonly #now: () => IsoTimestamp;
  #sequence = 0;

  constructor(now: () => IsoTimestamp) {
    this.#now = now;
  }

  generate(spec: DocumentSpec): Promise<DocumentArtifact> {
    const content = render(spec.template, spec.variables);
    this.#sequence += 1;
    const artifact: DocumentArtifact = {
      id: `doc-${this.#sequence}`,
      title: spec.title,
      content,
      generatedAt: this.#now(),
    };
    return Promise.resolve(artifact);
  }
}

/** Names of variables referenced by a template but missing from the inputs. */
export function missingVariables(spec: DocumentSpec): string[] {
  const referenced = new Set<string>();
  for (const match of spec.template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
    const name = match[1];
    if (name !== undefined) {
      referenced.add(name);
    }
  }
  return [...referenced].filter((name) => !(name in spec.variables));
}

function render(template: string, variables: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_whole, name: string) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? variables[name]! : `{{${name}}}`,
  );
}
