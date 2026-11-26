import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/playfair-display/wght-italic.css'
import './styles.css'
import { Layout } from './components/Layout'
import { SessionProvider, PrivateRoute } from './session'
import { Home, Services, ServiceDetail, NotFound } from './pages/Public'
import { AuthForm, VerifyEmail } from './pages/Auth'
import { BookingPage } from './pages/Booking'
import { AppointmentDetail, AppointmentList } from './pages/Appointments'
import { AdminEditor, AdminServices } from './pages/Admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="servicios" element={<Services />} />
            <Route path="servicios/:id" element={<ServiceDetail />} />
            <Route path="ingresar" element={<AuthForm key="login" mode="login" />} />
            <Route
              path="registro"
              element={<AuthForm key="register" mode="register" />}
            />
            <Route
              path="reenviar-enlace"
              element={<AuthForm key="resend" mode="resend" />}
            />
            <Route path="verificar-email" element={<VerifyEmail />} />
            <Route element={<PrivateRoute />}>
              <Route path="reservar" element={<BookingPage />} />
              <Route path="mis-turnos" element={<AppointmentList />} />
              <Route path="mis-turnos/:id" element={<AppointmentDetail />} />
              <Route path="mis-turnos/:id/editar" element={<BookingPage />} />
            </Route>
            <Route element={<PrivateRoute admin />}>
              <Route path="admin/servicios" element={<AdminServices />} />
              <Route path="admin/servicios/nuevo" element={<AdminEditor />} />
              <Route path="admin/servicios/:id/editar" element={<AdminEditor />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
