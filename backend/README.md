# Backend de Aroma Spa

API REST en Express con MongoDB y Mongoose. El código está organizado en rutas, controladores, servicios y repositorios. La autenticación usa bcrypt, JWT Bearer y verificación por correo con Nodemailer.

Desde la raíz del repositorio, instalá las dependencias con `npm ci`, configurá `backend/.env` a partir de `backend/.env.example` y ejecutá `npm run dev:api`. El [README principal](../README.md) documenta el arranque completo y los endpoints. La [colección de Postman](../docs/AromaSpa.postman_collection.json) incluye el flujo de autenticación, servicios y turnos.

Comprobá la API desplegada en [Render](https://aroma-spa.onrender.com/api/ready).
