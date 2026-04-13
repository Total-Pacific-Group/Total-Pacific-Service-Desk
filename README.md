Total Pacific Service Desk (TPSD)

Sistema de gestión de tickets para soporte técnico desarrollado para optimizar y automatizar los procesos del departamento de TI en Total Pacific Group.

--Descripción

Total Pacific Service Desk es una aplicación web que permite gestionar solicitudes de soporte técnico mediante un sistema estructurado de tickets, mejorando la organización, trazabilidad y tiempos de respuesta.

El sistema reemplaza procesos manuales basados en correos electrónicos y gestión física, centralizando toda la información en una plataforma digital.


--Objetivos

* Centralizar la gestión de incidencias
* Mejorar la comunicación entre usuarios y TI
* Controlar estados de solicitudes y requerimientos
* Generar historial y trazabilidad completa


--Funcionalidades

Usuario

* Crear tickets de soporte
* Consultar estado de solicitudes
* Ver historial de tickets
* Crear reclamo de un ticket en caso de considerar que una solicitud no fue correctamente solventado

Administrador(es) (TI)

* Gestionar tickets
* Asignar responsables
* Cambiar estados (pendiente, revisión, escalado, finalizado)
* Escalar solicitudes
* Administrar usuarios


-- Flujo del Sistema

Usuario crea ticket
↓
Ticket en estado "pendiente"
↓
Equipo TI revisa y diagnostica
↓
Asignación o escalamiento
↓
Actualización de estados
↓
Resolución del problema
↓
Cierre del ticket con resumen


Notificaciones Automáticas

El sistema envía correos en:

* Creación de ticket
* Creación de usuario
* Cambio de estado
* Cierre del ticket


-- Arquitectura

Frontend

* React (Vite)
* React Router
* Context API (Auth)

Backend

* Node.js

Base de Datos

MySQL

Otros

* JWT (autenticación)
* BW Encrypt (hash de contraseñas)
* Nodemailer (envío de correos)


-- Estructura del Proyecto

```
Total Pacific Service Desk/
│
├── ticketera-api/
|   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
|   ├── app.js
│   ├── .env
|   ├── package-lock.json
|   ├── package.json
|
├── ticketera-ui/
|   ├── node_modules
|   ├── public
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.css
│   │   └── App.jsx
│   │   ├── index.css/
│   │   ├── main.jsx/
|   ├── .gitignore
|   ├── eslint.config.js
|   ├── index.html
|   ├── package-lock.json
|   ├── package.json
|   ├── README.MD
|   ├── vite.config.js
│

```

---

-- Seguridad

* Autenticación basada en JWT
* Protección de rutas por roles
* Manejo de credenciales mediante variables de entorno


-- Beneficios

* Reducción de desorden en correos
* Mejor trazabilidad de incidencias
* Mayor control del área de TI
* Automatización de procesos repetitivos
* Base para métricas y reportes

Estado del Proyecto

🚧 Versión actual: **v1.0**

Incluye:

* Sistema de login
* Estructura base de tickets
* Arquitectura completa frontend/backend


Mejoras Futuras

* Dashboard con métricas avanzadas
* Reportes automáticos (PDF)
* Sistema de SLA
* Asignacion de tickets por usuario



## 👨‍💻 Autor

Desarrollado por **Israel Aguirre**

---

## 📄 Licencia

MIT License
