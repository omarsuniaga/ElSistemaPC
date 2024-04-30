//firebaseServices.js
import { Alert } from 'react-native';
import { db } from './firebaseConfig';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, setDoc, Timestamp ,deleteDoc } from 'firebase/firestore';
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = (date.getDate() + 1).toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
  export const observarCambios = (coleccion, manejarCambios) => {
    const coleccionRef = collection(db, coleccion);
    let desuscribir = () => {};
    try {
      desuscribir = onSnapshot(coleccionRef, (snapshot) => {
        const documentos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // si documentos es undefined, se llena con un arreglo vacío
        manejarCambios(documentos);
      })
      
    } catch (error) {
      console.log("Error al observar cambios:", error);
    }
    
    return desuscribir;
  // Devuelve una función para desuscribirse de los cambios
};

const manejarCambios = (documentos) => documentos;

const desuscribir = observarCambios('ASISTENCIAS', manejarCambios);

// Cuando ya no necesites observar los cambios
// desuscribir();
// Crear un documento en una colección
export const crearDocumento = async (coleccion,id ,datos) => {
  try {
   await setDoc(doc(db, coleccion, id), {...datos,
         date: Timestamp.fromDate(new Date(datos.fecha+' '+datos.hora)),
         registrado: Timestamp.fromDate(new Date(Date.now())),
         estado:"pendiente"
    });
    // const docRef = await addDoc(collection(db, coleccion), datos);
    return; // Retornar el nuevo objeto que contiene el ID del documento
  } catch (error) {
    console.error("Error al agregar documento:", error);
    throw error;
  }
};


// cargar eventos de firebase
export const cargarAlumnos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "ALUMNOS"));
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(alumno => alumno.instrumento !== ''); // Reemplaza 'propiedad' con el nombre de la propiedad que quieres comprobar
  } catch (error) {
    console.error("Error al cargar Alumnos:", error);
    throw error;
  }
};

// Cargar categorias
export const cargarCategorias = async()=>{
  try {
    const querySnapshot = await getDocs(collection(db, "MODULOS"));
    return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al cargar Categorias:", error);
    throw error;
  }
}

// Leer todos los documentos de una colección
export const leerDocumentos = async (coleccion) => {
  try {
    const querySnapshot = await getDocs(collection(db, coleccion));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al leer documentos:", error);
    throw error;
  }
};

// Actualizar un documento
export const actualizarDocumento = async (coleccion, id, nuevosDatos) => {
  const ActualizarRef = doc(db, coleccion, id);
  
  try {
    await updateDoc(ActualizarRef, {
      ...nuevosDatos,
      date: Timestamp.fromDate(new Date(nuevosDatos.fecha+' '+nuevosDatos.hora)),
      modificado: Timestamp.fromDate(new Date(Date.now())),
    });
    
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    throw error;
  }
};

// Eliminar un documento
export const eliminarDocumento = async (coleccion, id) => {
  try {
    await deleteDoc(doc(db, coleccion, id));
    console.log("Documento eliminado:", id);
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    throw error;
  }
};

export const obtenerResponsables = async () => {
  const querySnapshot = await getDocs(collection(db, "ALUMNOS"));
  const responsables = querySnapshot.docs.map((doc) => doc.data().responsable);
  return responsables;
}; 

export const obtenerReportes = async () => {
  const querySnapshot = await getDocs(collection(db, "ALUMNOS"));
  const eventos = querySnapshot.docs.map((doc) => doc.data());
  return eventos;
};


/// Revisar asistencias del día y actualizar o crear
export const guardarAsistencia = async (Data) => {
  const fechaHoy = formatDate(new Date());
  try {
    const asistenciasQuery = collection(db, "ASISTENCIAS");
    const snapshot = await getDocs(asistenciasQuery);
    const asistenciasHoy = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(asistencia => formatDate(asistencia.fecha.toDate()) === fechaHoy);

    if (asistenciasHoy.length > 0) {
      await actualizarDocumento("ASISTENCIAS", asistenciasHoy[0].id, Data);
      console.log("Asistencia actualizada");
    } else {
      await registrarAsistencia(Data);
      console.log("Asistencia registrada");
    }
  } catch (error) {
    console.error("Error al guardar asistencia:", error);
    throw error;  // Lanzar error para manejo externo si es necesario
  }
};

// registrar asistencias
export const registrarAsistencia = async (Data) => {
  try {
    await setDoc(doc(db, "ASISTENCIAS", new Date().toISOString()), { Data });
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    throw error;
  }
};

// Obtener las asistencias del mes actual
export const obtenerAsistenciasMesActual = async () => {
  try {
    // Obtener la fecha actual
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript son indexados desde 0

    // Construir la consulta para obtener las asistencias del mes actual
    const asistenciasRef = collection(db, "ASISTENCIAS");
    const consulta = asistenciasRef.where('Fecha', '>=', `${añoActual}-${mesActual}-01`)
                                   .where('Fecha', '<=', `${añoActual}-${mesActual}-31`);
    
    // Ejecutar la consulta
    const snapshot = await getDocs(consulta);
    const asistenciasMesActual = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return asistenciasMesActual;
  } catch (error) {
    console.error("Error al obtener asistencias del mes actual:", error);
    throw error;
  }
};

// Procesar las asistencias del mes actual
export const procesarAsistenciasMesActual = async () => {
  try {
    // Obtener las asistencias del mes actual
    const asistenciasMesActual = await obtenerAsistenciasMesActual();

    // Aquí puedes realizar los cálculos y clasificaciones necesarias con las asistencias obtenidas
    // Por ejemplo: calcular cuántas veces ha asistido cada alumno en el mes, clasificarlos por grupo, etc.
    // Puedes devolver la información procesada en un objeto o array, según tus necesidades

    // Ejemplo: Calcular el número de asistencias por alumno
    const asistenciasPorAlumno = {};
    asistenciasMesActual.forEach(asistencia => {
      asistencia.presentes.forEach(idAlumno => {
        if (!asistenciasPorAlumno[idAlumno]) {
          asistenciasPorAlumno[idAlumno] = 1;
        } else {
          asistenciasPorAlumno[idAlumno]++;
        }
      });
    });

    return asistenciasPorAlumno;
  } catch (error) {
    console.error("Error al procesar asistencias del mes actual:", error);
    throw error;
  }
};



export const obtenerColeccionAsistencias = async () => {
  try {
    const asistenciasRef = collection(db, 'ASISTENCIAS');
    return asistenciasRef;
  } catch (error) {
    console.error("Error al obtener referencia a la colección de asistencias:", error);
    throw error;
  }
};

//2. Filtrar aquellos alumnos que han asistido durante el mes:
export const filtrarAlumnosAsistidosMesActual = async () => {
  try {
    const asistenciasRef = await obtenerColeccionAsistencias();
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript son indexados desde 0

    const consulta = query(asistenciasRef, 
                           where('Fecha', '>=', `${añoActual}-${mesActual}-01`),
                           where('Fecha', '<=', `${añoActual}-${mesActual}-31`));
    const snapshot = await getDocs(consulta);
    const alumnosAsistidosMesActual = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      data.presentes.forEach(alumnoId => {
        if (!alumnosAsistidosMesActual.includes(alumnoId)) {
          alumnosAsistidosMesActual.push(alumnoId);
        }
      });
    });

    return alumnosAsistidosMesActual;
  } catch (error) {
    console.error("Error al filtrar alumnos asistidos del mes actual:", error);
    throw error;
  }
};

// 3. Calcular cuántas veces ha asistido el alumno en ese mes:
export const calcularAsistenciasPorAlumno = async () => {
  try {
    const alumnosAsistidos = await filtrarAlumnosAsistidosMesActual();
    const asistenciasPorAlumno = {};

    alumnosAsistidos.forEach(alumnoId => {
      if (!asistenciasPorAlumno[alumnoId]) {
        asistenciasPorAlumno[alumnoId] = 1;
      } else {
        asistenciasPorAlumno[alumnoId]++;
      }
    });

    return asistenciasPorAlumno;
  } catch (error) {
    console.error("Error al calcular asistencias por alumno del mes actual:", error);
    throw error;
  }
};

//4. Clasificar a cada alumno según el grupo:
export const clasificarAlumnosPorGrupo = async () => {
  try {
    const asistenciasPorAlumno = await calcularAsistenciasPorAlumno();
    const alumnosPorGrupo = {
      'Iniciacion 1': [],
      'Iniciacion 2': [],
      'Iniciacion 3': [],
      'Iniciacion Coro': [],
      'Coro': [],
      'Iniciacion Instrumental': [],
      'Orquesta': [],
      'Orquesta Juvenil': [],
      'Coro Juvenil': [],
      // Agrega más grupos según sea necesario
    };

    // Aquí debes obtener los grupos de tus alumnos y clasificarlos según corresponda
    // Por ahora, clasificaré aleatoriamente a los alumnos en dos grupos ficticios: 'Grupo A' y 'Grupo B'
    Object.keys(asistenciasPorAlumno).forEach(alumnoId => {
      const grupo = Math.random() < 0.5 ? 'Grupo A' : 'Grupo B';
      alumnosPorGrupo[grupo].push(alumnoId);
    });

    return alumnosPorGrupo;
  } catch (error) {
    console.error("Error al clasificar alumnos por grupo:", error);
    throw error;
  }
};

//5. Generar un listado de todos aquellos alumnos presentes y ausentes del mes:
export const generarListadoAsistenciasMesActual = async () => {
  try {
    const alumnosPorGrupo = await clasificarAlumnosPorGrupo();
    const listadoAsistencias = {};

    // Aquí debes obtener el estado de cada alumno (presente o ausente) y generar el listado correspondiente
    // Por ahora, generaré un listado ficticio con algunos alumnos presentes y otros ausentes
    Object.keys(alumnosPorGrupo).forEach(grupo => {
      listadoAsistencias[grupo] = alumnosPorGrupo[grupo].map(alumnoId => ({
        id: alumnoId,
        nombre: `Alumno ${alumnoId}`,
        estado: Math.random() < 0.8 ? 'Presente' : 'Ausente', // 80% de probabilidad de estar presente
      }));
    });

    return listadoAsistencias;
  } catch (error) {
    console.error("Error al generar listado de asistencias del mes actual:", error);
    throw error;
  }
};


export const obtenerDatosDeAsistencia = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'ASISTENCIAS'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener los datos de asistencia:', error);
    throw error;
  }
};

//Obtener asistencias
export const ObtenerAsistencias = async (id) => {
  let objeto = {};
  try {
    let pres = 0;
    let ause = 0;
    let _l = await Mostrar_todo().then((elem) => elem.map((e) => e.data())); //Jalando asistencias
    _l.filter(
      (elem) =>
        elem.Data.presentes.filter((e) =>
          e === id ? (pres = pres + 1) : null
        ) &&
        elem.Data.ausentes.filter((e) => (e === id ? (ause = ause + 1) : null))
    );
    objeto.presente = pres;
    objeto.ausente = ause;
    objeto.id = id;
    return objeto;
  } catch (error) {
    console.log(error);
  }
};
export const Mostrar_todo = async () => {
  try {
    let asistenciasRef = collection(db, "ASISTENCIAS");
    let q = query(asistenciasRef);
    let asistencia = await getDocs(q);
    return asistencia.docs;
  } catch (error) {
    console.log(error);
  }
};

export const Buscar_Grupo = async (fecha, grupo) => {
  try {
    let q = query(
      collection(db, "ASISTENCIAS"),
      where("Fecha", "==", fecha),
      where("grupo", "==", grupo)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty === false) {
      return querySnapshot.docs[0];
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
  return null;
};
export const Asistencia_de_Hoy = async (
  presentes,
  ausentes,
  Fecha_de_Hoy,
  grupo
) => {
  let res = await Buscar_Grupo(Fecha_de_Hoy, grupo).then((e) =>
    e.id === undefined ? null : e.id
  );
  try {
    if (res === null) {
      return await addDoc(collection(db, "ASISTENCIAS"), {
        Fecha: Fecha_de_Hoy,
        Data: { presentes, ausentes },
        grupo,
      });
    } else {
      const Ref = doc(db, "ASISTENCIAS", res);
      return await setDoc(Ref, {
        Fecha: Fecha_de_Hoy,
        Data: { presentes, ausentes },
        grupo,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const crearModulo = async (modulo) => {
  try {
    addDoc(collection(db, 'MODULOS'), {
      ...modulo,
      registrado: Timestamp.fromDate(new Date(Date.now())),
    })
    console.log('Módulo creado correctamente:', modulo);
  } catch (error) {
    console.error('Error al crear módulo:', error);
    throw error;
  }
}


export const obtenerModulos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'MODULOS'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    throw error;
  }
} 
export const eliminarModulo = async (id) => {
  try {
    await deleteDoc(doc(db, 'MODULOS', id));
    console.log('Módulo eliminado correctamente:', id);
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    throw error;
  }
}

// buscar por fechas las asistencias de la coleccion ASISTENCIAS


export const buscarAsistenciasPorFecha = async (fecha) => {
  try {
    const asistenciasRef = collection(db, 'ASISTENCIAS');
    const consulta = query(asistenciasRef, where('Fecha', '==', fecha));
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } ));
  } catch (error) {
    console.error('Error al buscar asistencias por fecha:', error);
    throw error;
  }
};

// Iterar ASISTENCIA y extraer las fechas
export const extraerFechas = async (documentos) => {
  const fechas = [];
  documentos.forEach(doc => {
    const { Fecha } = doc;
    fechas.push({ fecha: Fecha.toDate() });
  });
  return fechas;
};