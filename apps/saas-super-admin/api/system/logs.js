// Vercel serverless function: returns placeholder logs
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  // TODO: Replace with real log retrieval logic
  res.status(200).json({ logs: [] })
}
