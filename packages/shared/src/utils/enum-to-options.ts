export const enumToOptions = <T extends string>(
    enumObj: Record<string, T>,
    labels: Record<T, string>,
) => Object.values(enumObj).map((value) => ({ value, label: labels[value] }));
