import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  { path: '/', element: <h1>겸상</h1> },
])

export default function App() {
  return <RouterProvider router={router} />
}
