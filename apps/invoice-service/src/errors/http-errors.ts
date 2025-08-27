export class HttpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code: string = 'BAD_REQUEST') {
    super(message, code, 400)
    this.name = 'BadRequestError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, code, 404)
    this.name = 'NotFoundError'
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string, code: string = 'INTERNAL_SERVER_ERROR') {
    super(message, code, 500)
    this.name = 'InternalServerError'
  }
}
