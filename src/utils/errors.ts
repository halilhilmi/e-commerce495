
class MissingParameterError extends Error {
    constructor(parameter: string) {
        super(`Missing parameter: ${parameter}`);
        
        this.name = 'MissingParameterError';
    }
}

class NotFoundError extends Error {
    constructor(type: string) {
        super(`${type} not found`);

        this.name = 'NotFoundError';
    }
}

class RateLimitError extends Error {
    constructor(user_id : string) {
        super("Suspicious activity detected.");

        this.name = 'Rate Limit Error';
    }
}

export {
    MissingParameterError,
    RateLimitError,
    NotFoundError
}

