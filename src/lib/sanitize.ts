/**
 * Escapes special LIKE pattern characters (% and _) in a string
 * to prevent unintended pattern matching in SQL LIKE queries.
 */
export const escapeLikePattern = (str: string): string => {
  return str.replace(/[%_]/g, '\\$&');
};
