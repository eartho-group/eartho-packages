export default {
  API_URL:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://api.eartho.io', // <- production api url
}
