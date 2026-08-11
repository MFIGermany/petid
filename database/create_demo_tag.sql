-- Crea una chapita física "virgen" para probar activación.
INSERT INTO tags (activation_code, status)
VALUES ('PETID-DEMO-01', 'inactive')
ON CONFLICT (activation_code) DO NOTHING;

SELECT * FROM tags WHERE activation_code='PETID-DEMO-01';
