const fetch = require('./fetch')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const createClient = () => {
  let id = 0
  const url = '/direct'

  const request = async (method, params) => {
    id++

    const req = {
      id,
      jsonrpc: '2.0',
      method,
      params,
    }

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(req),
    })

    const { result, error } = await res.json()

    if (error) {
      const e = new Error(error.message)
      e.code = error.code
      e.data = error.data
      throw e
    }

    return result
  }

  return request
}

module.exports = createClient
