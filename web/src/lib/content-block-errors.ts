export type BlockFieldError = {
  blockId: string;
  blockType: string;
  field: string;
  message: string;
};

export type BlockErrorMap = Record<string, BlockFieldError[]>;

export function groupBlockErrors(errors: BlockFieldError[]): BlockErrorMap {
  return errors.reduce<BlockErrorMap>((accumulator, error) => {
    accumulator[error.blockId] = [...(accumulator[error.blockId] ?? []), error];
    return accumulator;
  }, {});
}

export function getFieldError(
  errors: BlockFieldError[] | undefined,
  fieldPath: string | string[],
): string | null {
  if (!errors || errors.length === 0) return null;

  const fieldPaths = Array.isArray(fieldPath) ? fieldPath : [fieldPath];
  for (const path of fieldPaths) {
    const match = errors.find((error) => error.field === path);
    if (match) return match.message;
  }

  return null;
}

export function clearBlockErrors(
  errors: BlockFieldError[],
  blockId: string,
  fieldPath?: string | string[],
): BlockFieldError[] {
  if (!fieldPath) {
    return errors.filter((error) => error.blockId !== blockId);
  }

  const fieldPaths = Array.isArray(fieldPath) ? fieldPath : [fieldPath];
  return errors.filter(
    (error) => error.blockId !== blockId || !fieldPaths.includes(error.field),
  );
}

export function getErrorSummary(errors: BlockFieldError[]) {
  return {
    totalFieldErrors: errors.length,
    totalBlocksWithErrors: Object.keys(groupBlockErrors(errors)).length,
  };
}
