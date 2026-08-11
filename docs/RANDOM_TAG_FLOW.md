# PetID - flujo de código automático de chapita

## Regla principal

El cliente nunca escribe ni decide el código de una chapita.

Al abrir `/tags/activate`, el backend reserva una fila `tags` en estado `inactive` y genera:

- `activation_code`: código interno de inventario.
- `public_code`: código definitivo que forma parte de `/p/{public_code}` y de la URL NFC/QR.

El `public_code` se muestra en un input `readonly` únicamente como información.

## Seguridad

El POST `/tags/activate` no recibe el código como fuente de verdad. El `tag_id` reservado se conserva en `req.session.pendingTagId`. Aunque alguien altere el HTML del navegador, no puede elegir qué código activar.

## Renovación

Si la mascota ya tiene una tag activa:

1. Se bloquean mascota, tag nueva y tag anterior dentro de una transacción PostgreSQL.
2. La tag anterior pasa de `active` a `disabled`.
3. La tag reservada pasa de `inactive` a `active` y se vincula a la mascota.
4. El perfil y los datos de la mascota no cambian.

## Nota de producto

Para producción física, lo habitual será generar las tags durante fabricación/inventario y grabar previamente `APP_URL/p/{public_code}` en NFC/QR. El flujo de reserva automática actual es apropiado para el MVP/desarrollo y deja listo el modelo de datos para separar después un panel administrativo de fabricación.
