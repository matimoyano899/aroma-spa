# Publicación y guía de demo

## Dos proyectos públicos

1. Los dos despliegues usan el mismo repositorio de GitHub y el lockfile de la raíz. Git debe ignorar los archivos `.env` y las dependencias.
2. El frontend se publica en Vercel con `frontend` como Root Directory, Vite como framework, `npm run build` como build y `dist` como salida. Permití incluir archivos de fuera de la carpeta raíz para que el instalador use el workspace y su lockfile.
3. El backend se publica como Web Service Node en Render. Dejá Root Directory vacío, configurá `npm ci` en Build Command y `npm run start -w backend` en Start Command. El servidor usa el puerto que Render inyecta.
4. Creá un usuario de aplicación con permiso de lectura y escritura sobre `aroma_spa` en MongoDB Atlas. Desde **Connect** en Render, copiá los rangos de salida mostrados para el servicio. Agregá cada rango como una entrada independiente en la lista de acceso IP de Atlas, con acceso vigente durante la evaluación. Guardá la URI en `MONGODB_URI` del backend.
5. En Render, configurá `CLIENT_ORIGIN` con `https://aroma-spa-kappa.vercel.app` y `JWT_SECRET` con un valor aleatorio. La configuración publicada de Brevo usa `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=2525`, `SMTP_SECURE=false` y `SMTP_REQUIRE_TLS=true`. Cargá el usuario de Brevo en `SMTP_USER`, su clave SMTP en `SMTP_PASSWORD` y el remitente verificado en `MAIL_FROM`.
6. En las variables de producción del frontend, configurá `VITE_API_URL=https://aroma-spa.onrender.com` y volvé a desplegar. El archivo `frontend/vercel.json` permite abrir directamente rutas del router como `/verificar-email`.
7. Al inicializar una base nueva, ejecutá `npm run seed` desde tu terminal con la URI de producción y los dos valores `ADMIN_*` en tu entorno local. Retirá las variables de siembra locales al terminar.
8. Confirmá `/api/health` y `/api/ready` en el dominio público. Hacé el circuito de demo en la URL pública del frontend, con una cuenta nueva.

Para activar los avisos de agenda, agregá `APPOINTMENTS_NOTIFY_EMAIL` en el proyecto del backend y volvé a desplegar si ya estaba publicado. Usá el correo donde la profesional quiere recibir las reservas, reprogramaciones y cancelaciones. `MAIL_FROM` sigue siendo el remitente autorizado por el proveedor SMTP. La verificación de cuenta se envía al correo de cada persona que se registra.

## Comprobar la publicación

- Abrí `/api/ready` desde la URL pública. Debe responder `{"data":{"database":"ready"}}`. Confirmá que Atlas autorice la salida del backend durante todo el período de corrección.
- Con las variables SMTP en `backend/.env`, ejecutá `npm run check:mail -w backend`. Comprueba conexión y autenticación sin enviar un correo. Para comprobar además que el proveedor acepta el remitente, ejecutá `npm run check:mail -w backend -- tu-buzon-de-prueba@example.com` con un buzón propio. Revisá la recepción y, si falla, mirá el código SMTP en la terminal.
- Desde la web pública, registrá una cuenta nueva y abrí el enlace recibido. Los registros del backend muestran el código y comando SMTP si el intento falla. Confirmá también que lleguen los avisos de agenda al destinatario configurado.
- En Postman, importá la colección y el entorno `Aroma Spa · Producción`. El entorno configura `https://aroma-spa.onrender.com/api` como `baseUrl`. Completá las credenciales de prueba en variables locales de Postman. El archivado del servicio está en la carpeta **Limpieza**, después de las pruebas de turnos.
- La instancia gratuita de Render puede tardar en responder a la primera solicitud después de un período de inactividad. Abrí [`/api/ready`](https://aroma-spa.onrender.com/api/ready) antes de iniciar la demo y esperá la respuesta.

El límite de intentos de la API que trae el proyecto es por instancia. Si instalás múltiples instancias para uso continuo y necesitás un límite global, conectá un almacén compartido o aplicá el límite del proveedor. Las colisiones de turnos sí se resuelven de forma compartida en MongoDB.

## Demo para la UTN

1. Abrí el catálogo y un detalle. Mostrá cómo la opción de reservar vuelve al servicio elegido después de iniciar sesión.
2. Registrá un correo de prueba. Antes de confirmarlo, probá el login y mostrale al evaluador el bloqueo. Abrí el correo, confirmá e ingresá.
3. Reservá un turno. Recargá la URL de detalle y abrí Mis turnos para mostrar persistencia. Reprogramá la reserva y verificá que el horario anterior se liberó. Cancelala.
4. Abrí una cuenta de administración. Creá un servicio de prueba, editá su duración y archivá el ítem. Verificá que dejó de aparecer en la vista pública.
5. Mostrá en DevTools el flujo con la API y la UI a 320 px. Revisá también el diseño a 2000 px.
6. Mostrá routes → controllers → services → repositories. En Postman, verificá una consulta sin JWT y una colisión de horario de la misma profesional.
7. En el campus entregá el enlace al repositorio, la URL del frontend y la URL de la API. El README y la colección Postman viajan en el repositorio.
