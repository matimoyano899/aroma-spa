# Aroma Spa · Agenda online

Trabajo integrador de Desarrollo Full Stack, UTN FRBA e-Learning. Aplicación de turnos para Aroma Spa, el estudio de masajes y estética de Gabriela Manuel en Sierras Bayas.

El recorrido de una clienta es registro, confirmación por correo, login, elección de servicio y horario, reserva, detalle, reprogramación y cancelación. El panel de administración permite consultar la agenda y crear, ver, editar o archivar servicios.

Con `APPOINTMENTS_NOTIFY_EMAIL` configurado, la profesional recibe un correo por cada reserva, cambio o cancelación. El aviso incluye el servicio, la fecha y hora argentina, la duración y el contacto de la persona. Si el envío falla, la operación queda guardada en la agenda y el servidor registra el fallo.

## Arranque local

Requiere Node.js 22.12 o posterior, npm y acceso a MongoDB y SMTP. El archivo Docker Compose levanta MongoDB y Mailpit para desarrollo. Si ya disponés de ambos servicios, podés usar sus datos de conexión.

1. En la carpeta raíz, ejecutá `npm ci` y `docker compose up -d`.
2. Copiá `backend/.env.example` a `backend/.env`. Generá `JWT_SECRET` con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y cargá el resultado en ese archivo.
3. En el mismo archivo, configurá `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear la cuenta administradora con la siembra. La contraseña administradora debe tener entre 12 caracteres y 72 bytes.
4. Ejecutá `npm run seed` desde la raíz. La siembra carga siete servicios con precios orientativos en pesos argentinos. Las corridas siguientes conservan los cambios y dejan archivados los servicios retirados. Si quedaron los dos masajes originales de cuerpo completo con la duración inicial de 60 minutos y el nombre de la siembra anterior, se actualizan a 90 minutos. Si ya tenías servicios cargados sin precio, actualizalos desde el panel de administración. Podés retirar las variables `ADMIN_*` después de la siembra local.
5. En dos terminales, ejecutá `npm run dev:api` y `npm run dev:web`.
6. Abrí [la app](http://localhost:5173), [el buzón local](http://localhost:8025) y, si necesitás diagnosticar la conexión, [la API](http://localhost:8080/api/ready).

En desarrollo, mismo hostname que `CLIENT_ORIGIN`. Si elegís otro origen o puerto, actualizá el backend y `VITE_API_URL`. El contenido de `VITE_*` es público. Mantené las credenciales en el servidor y los archivos `.env` fuera de Git.

## Estructura

```text
frontend/src/    Pantallas React, componentes, hooks y sesión
backend/src/
  routes/        Métodos HTTP, rutas y middlewares
  controllers/   Entrada, respuesta y códigos HTTP
  services/      Autenticación, permisos y reglas de reserva
  repositories/  Consultas mediante Mongoose
  models/        Esquemas e índices MongoDB
  middlewares/   Validación, JWT, roles y errores
docs/            Colección Postman y guía de publicación
```

### Reglas del dominio

- Una sola agenda. Configuración inicial lunes a sábado, 09:00 a 19:00, zona Buenos Aires y ventana de 60 días. El horario comercial se ajusta en `backend/src/utils/schedule.js`. Confirmá estos horarios y las duraciones antes de habilitar la agenda de clientes reales.
- Los precios iniciales son de $25.000 para espalda o piernas (45 min), $35.000 para cuerpo completo (90 min), $30.000 para drenaje linfático o masaje reductor y $32.000 para maderoterapia (60 min los tres). Administración puede editarlos desde el panel.
- Inicios cada 30 minutos y duraciones de 30, 45, 60, 90 o 120 minutos. Se guardan instantes UTC y se muestran con horario argentino.
- Cada turno referencia a un servicio y a un cliente. Guarda además el nombre, duración y precio al momento de la reserva. Un índice único sobre las franjas de 15 minutos ocupadas bloquea superposiciones incluso con peticiones simultáneas.
- Los clientes ven y gestionan sus propios turnos futuros. Al cancelar se elimina el turno y se libera el horario. Administración ve toda la agenda. Archivar un servicio lo retira del catálogo y conserva los turnos que ya se reservaron.
- Las contraseñas se hashean con bcrypt. El JWT de acceso vence en dos horas y el backend verifica además el usuario persistido y sus permisos. El correo tiene su propio token aleatorio de un solo uso, con vencimiento y hash persistido. Reenviar invalida el enlace anterior.
- En el navegador, la sesión vive en `sessionStorage` hasta cerrar la pestaña o cerrar sesión. Esa decisión permite usar JWT Bearer como pide la consigna. La API es la que aplica la autorización.

## API

Prefijo `/api`. Las respuestas exitosas con cuerpo usan `{ "data": ... }`, las de error usan `{ "error": { "code": "...", "message": "..." } }`. En las rutas protegidas se usa `Authorization: Bearer <JWT>`.

| Método y ruta                  | Acceso        | Entrada y resultado                                                                                       |
| ------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------- |
| GET /health                    | Público       | Comprueba que la API responde.                                                                            |
| GET /ready                     | Público       | Verifica conexión e inicialización de MongoDB.                                                            |
| POST /auth/register            | Público       | `{name,email,password}`; 201 y correo de verificación.                                                    |
| POST /auth/resend              | Público       | `{email}`; 200 y mensaje genérico.                                                                        |
| POST /auth/verify              | Público       | `{token}`; 200 si la cuenta se confirma.                                                                  |
| POST /auth/login               | Público       | `{email,password}`; devuelve token y usuario.                                                             |
| GET /auth/me                   | Sesión        | Devuelve el usuario autenticado.                                                                          |
| GET /services                  | Público       | Lista de servicios disponibles.                                                                           |
| GET /services/:id              | Público       | Detalle de un servicio activo.                                                                            |
| POST /services                 | Admin         | `{name,description,duration,price}`; 201. `price` puede ser null.                                         |
| PUT /services/:id              | Admin         | Mismos campos que al crear; devuelve servicio actualizado.                                                |
| DELETE /services/:id           | Admin         | Archiva el servicio; 204.                                                                                 |
| GET /appointments              | Sesión        | `?period=upcoming\|past&page=1&limit=12`; lista paginada.                                                 |
| GET /appointments/availability | Sesión        | `?serviceId=…&date=AAAA-MM-DD`; lista de horas ISO. `excludeId` opcional, propio o admin, al reprogramar. |
| GET /appointments/:id          | Dueño o admin | Devuelve el detalle del turno.                                                                            |
| POST /appointments             | Sesión        | `{serviceId,startAt}`; 201. `startAt` es uno de los resultados de disponibilidad.                         |
| PUT /appointments/:id          | Dueño o admin | Reprograma un turno futuro con los campos de POST.                                                        |
| DELETE /appointments/:id       | Dueño o admin | Cancela el turno; 204. Un cliente solo puede cancelar un turno futuro.                                    |

Probar los estados `400` de input inválido, `401` de sesión faltante, `403` de permiso insuficiente o correo pendiente, `404` de recurso ausente o ajeno y `409` de superposición.

- `npm test` ejecuta los casos de horarios y la integración HTTP con MongoDB de prueba y un buzón SMTP temporal. Si usás una instancia de pruebas ya iniciada, indicá `TEST_MONGODB_URI`; el test crea y elimina una base con prefijo `aroma_test_`.
- `npm run build` compila React para producción.
- Importá [la colección de Postman](docs/AromaSpa.postman_collection.json). El valor inicial de `baseUrl` apunta al entorno local. Para consultar la API pública, importá y seleccioná [el entorno de producción](docs/AromaSpa.Produccion.postman_environment.json). Para ejecutar el flujo de autenticación, usá un correo de prueba y copiá el token del enlace recibido en `verificationToken`. La colección guarda el JWT y los ID de las respuestas para el resto del flujo.

## Entrega

- Repositorio de React y Express en [Aroma Spa en GitHub](https://github.com/matimoyano899/aroma-spa).
- Frontend de producción en [Vercel](https://aroma-spa-kappa.vercel.app/).
- Backend de producción en [Render](https://aroma-spa.onrender.com/api/ready). El catálogo público se puede consultar en [`GET /api/services`](https://aroma-spa.onrender.com/api/services).

Consultá el [README del frontend](frontend/README.md), el [README del backend](backend/README.md) y la [guía de publicación y demo](docs/PUBLICACION.md).
