const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Substituição simples de variáveis — sem execução de HTML externo.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = variables[key];
    return value ?? "";
  });
}
