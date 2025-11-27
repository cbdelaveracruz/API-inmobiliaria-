# Plantillas de Mandatos

Esta carpeta contiene las plantillas de documentos en formato `.docx` que se utilizan para generar mandatos de venta.

## Archivos

### `mandato_venta_persona_fisica.docx`

Plantilla del mandato de venta para persona física. Este archivo debe:

- Estar diseñado con el formato correcto en Microsoft Word
- Contener el encabezado azul con "MANDATO DE VENTA – PERSONA FÍSICA"
- Incluir una tabla con tipo de propiedad, calle, partida, localidad, propietarios, etc.
- Tener una segunda hoja con el texto legal de AUTORIZACIÓN, párrafos numerados y zona de firmas
- **NO** contener texto vertical ni formato complejo generado por código

## Uso

### Endpoint actual

El endpoint `GET /mandatos/plantilla/persona-fisica` sirve este archivo tal cual está, sin modificaciones:

```bash
# Ejemplo de llamada (requiere autenticación)
curl -X GET http://localhost:3000/mandatos/plantilla/persona-fisica \
  -H "Authorization: Bearer TU_TOKEN" \
  --output mandato.docx
```

### Futuras mejoras (no implementadas)

En el futuro, se podrían implementar las siguientes funcionalidades:

1. **Reemplazo de placeholders**: Usar librerías como `docxtemplater` para reemplazar marcadores de posición con datos reales de la propiedad/mandato
2. **Conversión a PDF**: Convertir automáticamente el `.docx` a PDF para distribución
3. **Firmas digitales**: Integrar capacidad de firma electrónica

## Cómo agregar el archivo de plantilla

1. Diseña tu mandato en Microsoft Word con el formato correcto
2. Guárdalo como `mandato_venta_persona_fisica.docx`
3. Copia el archivo a esta carpeta: `src/templates/`
4. El backend automáticamente lo servirá a través del endpoint

## Importante

⚠️ **No intentes generar este documento con código**. El enfoque actual es mantener el diseño exacto del archivo Word original sin modificaciones programáticas.
