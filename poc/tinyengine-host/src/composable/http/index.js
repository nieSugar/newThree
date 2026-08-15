import { HttpService } from '@opentiny/tiny-engine'

const unwrap = (response) => response.data?.data ?? response.data
const reject = (error) => Promise.reject(error?.response?.data?.error ?? error)

HttpService.apis.setOptions({
  axiosConfig: {
    baseURL: '',
    withCredentials: false,
    headers: {
      'x-lowcode-mode': 'develop',
      'x-lowcode-org': '1'
    }
  },
  interceptors: {
    response: [[unwrap, reject]]
  }
})

export default HttpService
