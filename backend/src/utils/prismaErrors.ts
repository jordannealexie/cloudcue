export const isPrismaRuntimeError = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return false;
  }

  const name = (error as { name: string }).name;
  return (
    name === "PrismaClientKnownRequestError" ||
    name === "PrismaClientValidationError" ||
    name === "PrismaClientInitializationError"
  );
};

export const rethrowPrismaRuntimeError = (error: unknown): void => {
  if (isPrismaRuntimeError(error)) {
    throw error;
  }
};
