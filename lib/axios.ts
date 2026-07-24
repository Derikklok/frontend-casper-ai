// lib/axios.ts
import Axios, { AxiosRequestConfig } from "axios"

// Rename this slightly so it doesn't conflict, or just leave it as axiosAppInstance
export const axiosAppInstance = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Request Interceptor: Automatically inject auth tokens
axiosAppInstance.interceptors.request.use((config) => {
  const isAuthenticationRequest = config.url?.includes("/auth/")
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth-token") : null
  if (token && !isAuthenticationRequest) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response Interceptor: Combine your token saving and error handling
axiosAppInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
    }
    return Promise.reject(error)
  }
)

// 👇 ADD THIS: This is the exact function Orval needs to generate the hooks properly
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return axiosAppInstance({
    ...config,
    ...options,
  }).then(({ data }) => data) // Automatically unwraps the Axios response!
}
