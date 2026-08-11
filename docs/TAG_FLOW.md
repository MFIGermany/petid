# Flujo de activación y reemplazo de chapitas

## Reglas

- Una mascota puede tener historial de varias chapitas.
- Solo una chapita puede estar `active` para una mascota en el flujo normal.
- Una chapita nueva debe estar `inactive` para poder activarse.
- Si la mascota no tiene chapita activa: `inactive -> active`.
- Si la mascota ya tiene una activa: la anterior pasa a `disabled` y la nueva a `active`.
- Una chapita `disabled` no se reactiva mediante el formulario normal.
- Una chapita ya activa para otra mascota no puede reutilizarse.

No requiere migración de BD con el esquema actual (`inactive`, `active`, `disabled`).
