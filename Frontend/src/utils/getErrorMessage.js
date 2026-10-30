/**
 * Extracts a human-readable message from an axios error, matching the
 * backend's standard { success, message, errors } response shape.
 */
export default function getErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || "Something went wrong. Please try again.";

  if (data.errors && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    if (Array.isArray(firstError) && firstError.length > 0) {
      return `${firstKey}: ${firstError[0]}`;
    }
  }
  return data.message || "Something went wrong. Please try again.";
}
