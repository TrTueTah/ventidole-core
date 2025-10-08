export const convertStringToBool = (value: string) => value === "true";
export const convertStringToBoolUpdate = (value: string) => String(value).trim().toLowerCase() === "true";
