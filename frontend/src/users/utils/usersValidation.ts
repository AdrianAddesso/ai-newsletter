export const validateEmail = (
  value: string,
) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(value)

export const validateRequired = (
  value: string,
) =>
  value.trim().length > 1