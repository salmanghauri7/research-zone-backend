class apiResponse {
  constructor(statusCode, message, data = null, success = true) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(res, message, statusCode = 200, payload = null) {
    return res
      .status(statusCode)
      .json(new apiResponse(statusCode, message, payload, true));
  }

  static error(res, message, statusCode = 500, payload = null) {
    return res
      .status(statusCode)
      .json(new apiResponse(statusCode, message, payload, false));
  }
}

export default apiResponse;
