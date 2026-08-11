# PetID Node.js Starter

Migración del prototipo PetID a Node.js/Express.

## Stack

- Node.js + Express
- EJS
- PostgreSQL (Supabase)
- `pg`
- `express-session`
- `connect-pg-simple`
- bcryptjs
- CSS responsive propio

## 1. Configura `.env`

El proyecto ya contiene el host, puerto, base de datos y usuario de tu Session Pooler actual.

Solo completa:

```env
DB_PASSWORD=TU_PASSWORD_REAL
SESSION_SECRET=UNA_CLAVE_LARGA_Y_ALEATORIA
```

Para producción, no subas `.env` al repositorio.

## 2. Base de datos

Si vas a usar la BD que ya creaste con el proyecto PHP, ejecuta primero:

```text
database/migrate_from_php.sql
```

Ese script conserva los datos y agrega las columnas que necesita la versión Node.

Si prefieres empezar con una BD vacía, ejecuta:

```text
database/schema.sql
```

Para crear una chapita de prueba:

```text
database/create_demo_tag.sql
```

Código:

```text
PETID-DEMO-01
```

## 3. Instala

```bash
npm install
npm run dev
```

Abre:

```text
http://localhost:3002
```

## Flujo funcional

1. Crear cuenta `/register`
2. Crear mascota `/pets/new`
3. Activar chapita `/tags/activate`
4. Código demo `PETID-DEMO-01`
5. La activación genera un `public_code`
6. Se abre `/p/{public_code}`
7. Desde dashboard puedes marcar perdido/encontrado
8. Cada apertura pública registra una lectura en `tag_scans`

## Endpoint de desarrollo

Con sesión iniciada:

```text
POST /tags/dev/create-blank
```

crea una chapita virgen y devuelve JSON con su código. Está bloqueado si `NODE_ENV=production`.

## Fotos

Por ahora el formulario acepta `photo_url`. Lo siguiente recomendado es implementar Supabase Storage para subir directamente archivos.

## Railway

Configura en Railway las mismas variables de `.env`. Railway asignará `PORT`; la aplicación ya lo respeta.

En producción:

```env
NODE_ENV=production
APP_URL=https://tu-dominio.com
DB_SSL=true
```

La cookie de sesión se marcará `secure` automáticamente.
