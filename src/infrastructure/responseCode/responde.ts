export function successResponse(
  data: any,
  message = 'Success',
  status_code = 200,
  meta?: any,
) {
  return {
    status_code,
    message,
    data: JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value,
      ),
    ),
    meta,
  };
}
