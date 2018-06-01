function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

export function success(body = null) {
  return buildResponse(200, body);
}

export function failure(statusCode = 500, body = null) {
  return buildResponse(statusCode, body);
}
