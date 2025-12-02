export function ok(response) {
    return { code: 200, success: true, response }
}

export function error(error) {
    return { code: 500, success: false, response: error }
}

export function notFound(error) {
    return { code: 404, success: false, response: error }
}

export function unauthorized(error) {
    return { code: 401, success: false, response: error }
}

export default {}