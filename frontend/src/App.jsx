import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/devices/new" element={<RequireAuth><DeviceForm /></RequireAuth>} />
          <Route
            path="/devices/:deviceId"
            element={<RequireAuth><DeviceDetail /></RequireAuth>}
          />
          <Route
            path="/devices/:deviceId/edit"
            element={<RequireAuth><DeviceForm /></RequireAuth>}
          />
          <Route
            path="/devices/:deviceId/software/new"
            element={<RequireAuth><SoftwareForm /></RequireAuth>}
          />
          <Route
            path="/devices/:deviceId/software/:softwareId/edit"
            element={<RequireAuth><SoftwareForm /></RequireAuth>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}

export default App
