# PetID - Supabase Storage

## 1. Crear el bucket

En Supabase Dashboard:

Storage -> New bucket

Nombre:

    pet-photos

Configúralo como **Public bucket**.

Las fotos del perfil de PetID necesitan ser públicas porque `/p/:code` es una página pública y el navegador debe poder cargar la imagen directamente.

## 2. API key del backend

En Supabase:

Settings -> API Keys

Utiliza una **Secret key** (`sb_secret_...`) en el backend.

Si tu proyecto todavía utiliza claves legacy, también funciona `service_role`; el servicio admite temporalmente `SUPABASE_SERVICE_ROLE_KEY` como fallback.

Nunca envíes esta clave al navegador y nunca la subas a Git.

## 3. Variables en .env

Agrega:

    SUPABASE_URL=https://hanrbdiagytbjdnomyhu.supabase.co
    SUPABASE_SECRET_KEY=sb_secret_...
    SUPABASE_STORAGE_BUCKET=pet-photos

## 4. Dependencias

Ejecuta en la raíz del proyecto:

    npm install

Esto instalará `multer` y `@supabase/supabase-js` además de las dependencias existentes.

## 5. Flujo implementado

Nueva mascota:

    navegador -> multipart/form-data -> multer (memoria)
      -> Supabase Storage -> URL pública -> pets.photo_url

Editar mascota:

- Si no eliges otra foto, conserva la existente.
- Si eliges otra, sube la nueva, actualiza `pets.photo_url` y luego intenta borrar la anterior.

Eliminar mascota:

- Borra primero la mascota de la BD y luego intenta retirar su foto del bucket.

## 6. Límites

La carga acepta:

- JPEG
- PNG
- WEBP
- máximo 5 MB

No es necesario modificar el esquema de `pets`: seguimos usando la columna `photo_url` existente.
