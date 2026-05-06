/**
 * Script de migración: Corrige los nombres de documentos existentes en la BD
 * 
 * Problema: Los documentos se guardaban con el nombre del archivo del OS
 * (ej: "scan_23.pdf") en lugar de un nombre descriptivo basado en su tipo.
 * 
 * Este script actualiza el campo 'nombre' de todos los documentos existentes
 * para que coincida con el tipo de documento, haciendo que sea legible para
 * el revisor/admin.
 * 
 * Uso: node scripts/fix-document-names.js
 * Requiere: DATABASE_URL en .env
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeo de tipo → nombre descriptivo legible
const TIPO_A_NOMBRE = {
  'ESCRITURA': 'Título de Propiedad',
  'DNI': 'DNI del Propietario',
  'API': 'API',
  'TGI': 'TGI',
  'PLANOS': 'Planos',
  'MENSURA': 'Mensura',
  'TASA': 'Tasa',
  'OTRO': 'Otro documento',
  'PDF_COMPLETO': 'PDF Completo',
};

async function main() {
  console.log('🔧 Iniciando corrección de nombres de documentos...\n');

  // 1. Obtener todos los documentos
  const documentos = await prisma.documento.findMany({
    select: {
      id: true,
      tipo: true,
      nombre: true,
      expedienteId: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`📋 Total de documentos encontrados: ${documentos.length}\n`);

  let actualizados = 0;
  let yaCorrectos = 0;
  let errores = 0;

  for (const doc of documentos) {
    const nombreEsperado = TIPO_A_NOMBRE[doc.tipo];

    if (!nombreEsperado) {
      console.log(`  ⚠️  Doc #${doc.id} (Exp #${doc.expedienteId}): tipo desconocido "${doc.tipo}" - saltando`);
      errores++;
      continue;
    }

    // Si ya tiene el nombre correcto, no actualizar
    if (doc.nombre === nombreEsperado) {
      yaCorrectos++;
      continue;
    }

    // Actualizar nombre
    try {
      await prisma.documento.update({
        where: { id: doc.id },
        data: { nombre: nombreEsperado },
      });
      console.log(`  ✅ Doc #${doc.id} (Exp #${doc.expedienteId}): "${doc.nombre || '(null)'}" → "${nombreEsperado}" [tipo: ${doc.tipo}]`);
      actualizados++;
    } catch (err) {
      console.error(`  ❌ Error actualizando Doc #${doc.id}:`, err.message);
      errores++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Actualizados:    ${actualizados}`);
  console.log(`   ⏭️  Ya correctos:   ${yaCorrectos}`);
  console.log(`   ❌ Errores:         ${errores}`);
  console.log(`   📋 Total:           ${documentos.length}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
