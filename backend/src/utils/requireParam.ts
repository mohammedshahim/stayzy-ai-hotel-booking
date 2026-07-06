export function requireParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`Missing required route parameter: ${name}`);
  }
  return value;
}
