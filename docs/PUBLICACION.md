# Publicación y guía de demo

## Dos proyectos públicos

1. Subí esta carpeta raíz a un repositorio de GitHub de tu cuenta, con el lockfile y la estructura de carpetas. Revisá que Git ignore `.env`, credenciales y dependencias.
2. En Vercel, importá el mismo repositorio dos veces. Para el frontend, elegí `frontend` como Root Directory, Vite como framework, `npm run build` como build y `dist` como salida. Permití incluir archivos de fuera de la carpeta raíz para que el instalador use el workspace y su lockfile.
3. Para el backend, elegí `backend` como Root Directory y usá la detección de Express. `backend/src/index.js` exporta la aplicación; `src/server.js` es el arranque local. No cargues un comando de build del frontend en este proyecto.
4. Creá un usuario de aplicación con acceso a la base del proyecto en MongoDB Atlas y configurá el acceso de red para el entorno de ejecución. Guardá la URI, con el nombre de base correcto, en `MONGODB_URI` del backend.
5. Configurá en el backend `CLIENT_ORIGIN` con la URL del frontend sin barra al final, `JWT_SECRET` con un valor aleatorio, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM`. Usá un remitente permitido por tu proveedor. Usá un puerto de envío admitido por el proveedor de hosting, normalmente 465 o 587 con los parámetros TLS correspondientes al servicio SMTP.
6. En el frontend, configurá `VITE_API_URL` con el origen público de la API sin `/api`. Volvé a desplegar después de cargar las variables. `vercel.json` en frontend permite abrir directamente rutas del router como `/verificar-email`.
7. Una vez, ejecutá `npm run seed` desde tu terminal con la URI de producción y los dos valores `ADMIN_*` en tu entorno local. Nunca cargues el secreto de siembra administrador en las variables de Vercel. Volvé a quitar esos valores de la configuración local cuando termines.
8. Confirmá `/api/health` y `/api/ready` en el dominio público. Hacé el circuito de demo en la URL pública del frontend, con una cuenta nueva.

Para activar los avisos de agenda, agregá `APPOINTMENTS_NOTIFY_EMAIL` en el proyecto del backend y volvé a desplegar si ya estaba publicado. Usá el correo donde la profesional quiere recibir las reservas, reprogramaciones y cancelaciones. `MAIL_FROM` sigue siendo el remitente autorizado por el proveedor SMTP. La verificación de cuenta se envía al correo de cada persona que se registra.

## Comprobar la publicación

- Abrí `/api/ready` desde la URL pública. Debe responder `{"data":{"database":"ready"}}`. Confirmá que Atlas autorice la salida del backend durante todo el período de corrección.
- Con las variables SMTP en `backend/.env`, ejecutá `npm run check:mail -w backend`. Comprueba conexión y autenticación sin enviar un correo. Para comprobar además que el proveedor acepta el remitente, ejecutá `npm run check:mail -w backend -- tu-buzon-de-prueba@example.com` con un buzón propio. Revisá la recepción y, si falla, mirá el código SMTP en la terminal.
- Desde la web pública, registrá una cuenta nueva y abrí el enlace recibido. Los registros del backend muestran el código y comando SMTP si el intento falla. Confirmá también que lleguen los avisos de agenda al destinatario configurado.
- En Postman, usá la URL pública de la API seguida de `/api` como `baseUrl`. Completá las variables de prueba en tu entorno local de Postman. El archivado del servicio está en la carpeta **Limpieza**, después de las pruebas de turnos.

El límite de intentos de la API que trae el proyecto es por instancia. Si instalás múltiples instancias para uso continuo y necesitás un límite global, conectá un almacén compartido o aplicá el límite del proveedor. Las colisiones de turnos sí se resuelven de forma compartida en MongoDB.

Referencia de despliegue de la API: [Express en Vercel](https://vercel.com/docs/frameworks/backend/express).

## Demo para la UTN

1. Abrí el catálogo y un detalle. Mostrá cómo la opción de reservar vuelve al servicio elegido después de iniciar sesión.
2. Registrá un correo de prueba. Antes de confirmarlo, probá el login y mostrale al evaluador el bloqueo. Abrí el correo, confirmá e ingresá.
3. Reservá un turno. Recargá la URL de detalle y abrí Mis turnos para mostrar persistencia. Reprogramá la reserva y verificá que el horario anterior se liberó. Cancelala.
4. Abrí una cuenta de administración. Creá un servicio de prueba, editá su duración y archivá el ítem. Verificá que dejó de aparecer en la vista pública.
5. Mostrá en DevTools el flujo con la API y la UI a 320 px. Revisá también el diseño a 2000 px.
6. Mostrá routes → controllers → services → repositories. En Postman, verificá una consulta sin JWT y una colisión de horario de la misma profesional.
7. En el campus entregá el enlace al repositorio, la URL del frontend y la URL de la API. El README y la colección Postman viajan en el repositorio.
