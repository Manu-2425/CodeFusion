import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Notice from './components/Notice.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import DeviceForm from './pages/DeviceForm.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import SoftwareForm from './pages/SoftwareForm.jsx'

function App() {
  return (
    <>
      <NavBar />
      <main className="page">
        <Notice />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/devices/new" element={<DeviceForm />} />
          <Route path="/devices/:deviceId" element={<DeviceDetail />} />
          <Route path="/devices/:deviceId/edit" element={<DeviceForm />} />
          <Route path="/devices/:deviceId/software/new" element={<SoftwareForm />} />
          <Route
            path="/devices/:deviceId/software/:softwareId/edit"
            element={<SoftwareForm />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}

export default App
