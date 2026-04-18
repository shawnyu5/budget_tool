import { useSearchParams } from "@solidjs/router";
import { Accessor, createMemo } from "solid-js";
import { z } from "zod";

/**
 * Parse a search param on a page using a zod schema, and return the parsed search param object
 * @throws on zod parse error. The zod schema provided must not throw an error. Throwing is considered a bug
 */
export function useValidatedSearchParams<T extends z.AnyZodObject>(
  schema: T,
): [Accessor<z.infer<T>>, (vars: Partial<z.infer<T>>) => void] {
  const [params, setParams] = useSearchParams();

  const validated = createMemo(() => {
    const result = schema.parse(params);
    return result;
  });

  return [validated, setParams] as const;
}
