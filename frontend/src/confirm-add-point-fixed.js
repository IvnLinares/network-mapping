// Función para confirmar y guardar un nuevo punto de infraestructura
async function confirmAddPoint() {
  if (!tempMarker.value || !user.value) {
    alert('Error: No hay un marcador temporal o no hay usuario autenticado.');
    return;
  }
  
  try {
    const newPoint = {
      id: uuidv4(),
      type_id: selectedInfraType.value,
      latitude: tempMarker.value.lat,
      longitude: tempMarker.value.lng,
      name: newPointName.value || `${getTypeName(selectedInfraType.value)}-${Date.now().toString().slice(-6)}`,
      description: newPointDescription.value,
      created_at: new Date(),
      created_by: user.value.id,
      properties: {}
    };
    
    console.log('Intentando guardar punto:', newPoint);
    
    const { data, error } = await supabase
      .from('infrastructure_points')
      .insert([newPoint]);
      
    if (error) {
      console.error('Error detallado al insertar en BD:', error);
      
      // Verificar el tipo de error
      if (error.code === '42P01') { // Tabla no existe
        alert('Error: La tabla infrastructure_points no existe en la base de datos. Por favor, ejecuta el script SQL para crear las tablas.');
      } else if (error.code === '23505') { // Violación de unicidad
        alert('Error: Ya existe un punto con ese ID.');
      } else if (error.code === '23503') { // Violación de clave foránea
        alert('Error: El tipo de infraestructura seleccionado no es válido.');
      } else {
        alert(`Error al guardar en la base de datos: ${error.message}`);
      }
      
      // A pesar del error, añadir al array local para demostración
      infrastructurePoints.value.push(newPoint);
      console.log('Punto añadido localmente (no en BD)');
    } else {
      // Si se guardó correctamente, añadir a la lista local
      infrastructurePoints.value.push(newPoint);
      console.log('Punto guardado correctamente en BD y añadido localmente');
      alert('Punto guardado correctamente en la base de datos.');
    }
    
    // Reset en cualquier caso
    tempMarker.value = null;
    newPointName.value = '';
    newPointDescription.value = '';
    
  } catch (error) {
    console.error('Error general al guardar el punto:', error);
    
    // Intentar crear un punto local para demostración
    try {
      const newPoint = {
        id: uuidv4(),
        type_id: selectedInfraType.value,
        latitude: tempMarker.value.lat,
        longitude: tempMarker.value.lng,
        name: newPointName.value || `${getTypeName(selectedInfraType.value)}-${Date.now().toString().slice(-6)}`,
        description: newPointDescription.value,
        created_at: new Date(),
        created_by: user.value?.id || 'local-user',
        properties: {}
      };
      
      infrastructurePoints.value.push(newPoint);
      console.log('Punto añadido solo localmente debido a error:', error);
      alert('El punto se muestra localmente, pero no se ha guardado en la base de datos.');
    } catch (localError) {
      console.error('No se pudo crear ni siquiera localmente:', localError);
      alert('Error crítico: No se pudo agregar el punto ni siquiera localmente.');
    }
    
    // Reset
    tempMarker.value = null;
    newPointName.value = '';
    newPointDescription.value = '';
  }
}
