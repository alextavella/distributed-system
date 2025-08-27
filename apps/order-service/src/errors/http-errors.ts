export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code?: string) {
    super(400, message, code)
    this.name = 'BadRequestError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string, code?: string) {
    super(404, message, code)
    this.name = 'NotFoundError'
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message)
    this.name = 'InternalServerError'
  }
}
