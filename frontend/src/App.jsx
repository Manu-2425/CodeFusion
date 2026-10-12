import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import DeviceForm from './pages/DeviceForm.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <>
      <NavBar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices/new" element={<DeviceForm />} />
          <Route path="/devices/:deviceId" element={<DeviceDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}

export default App
