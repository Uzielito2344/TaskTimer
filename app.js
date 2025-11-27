// ============================================================
// TaskTimer - Sistema de cronómetro con historial persistente
// Almacena datos en localStorage bajo la clave:
const CLAVE_HISTORIAL = "tasktimer_history_v1";

// Variables del estado del temporizador
let intervalo_temporizador = null;        // ID del intervalo activo
let marca_tiempo_inicio = null;           // Momento exacto en que inició el conteo
let tiempo_transcurrido_antes_pausa = 0;  // Segundos acumulados antes de una pausa
let nombre_tarea_actual = "";             // Nombre de la tarea actual

// ============================================================
// Accesos rápidos al DOM (evita repetir document.getElementById)
const el = {
  nombre_tarea: () => document.getElementById("taskName"),
  boton_iniciar: () => document.getElementById("startBtn"),
  boton_pausar: () => document.getElementById("pauseBtn"),
  boton_detener: () => document.getElementById("stopBtn"),
  temporizador: () => document.getElementById("timer"),
  tarea_actual: () => document.getElementById("currentTask"),
  lista_historial: () => document.getElementById("historyList"),
  area_estadisticas: () => document.getElementById("statsArea"),
};

// ============================================================
// Convierte segundos → formato HH:MM:SS
function seg_a_hms(s){
  const h = Math.floor(s / 3600).toString().padStart(2,"0");
  const m = Math.floor((s % 3600)/60).toString().padStart(2,"0");
  const seg = Math.floor(s % 60).toString().padStart(2,"0");
  return `${h}:${m}:${seg}`;
}

// ============================================================
// Carga historial desde localStorage
function cargar_historial(){
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch(e){
    return [];
  }
}

// Guarda historial en localStorage
function guardar_historial(h){
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(h));
}

// ============================================================
// Renderiza historial y estadísticas en la interfaz
function renderizar_historial(){
  const historial = cargar_historial();
  const ul = el.lista_historial();
  ul.innerHTML = "";

  // Si no hay registros
  if(historial.length === 0){
    ul.innerHTML = "<li>No hay registros aún.</li>";
    el.area_estadisticas().textContent = "Sin datos aún";
    return;
  }

  // Mostrar el historial en orden cronológico inverso
  historial.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    const fecha = new Date(item.inicio_en).toLocaleString();
    li.textContent = `${item.tarea} — ${seg_a_hms(item.segundos)} — ${fecha}`;
    ul.appendChild(li);
  });

  // Cálculo de estadísticas (tiempo total por tarea)
  const totales = {};
  historial.forEach(it => {
    totales[it.tarea] = (totales[it.tarea] || 0) + it.segundos;
  });

  // Convertir estadísticas a texto
  const lineas = Object.entries(totales)
      .map(([tarea, seg]) => `${tarea}: ${seg_a_hms(seg)}`);

  el.area_estadisticas().innerHTML = lineas.join("<br/>");
}

// ============================================================
// Actualiza el display del cronómetro
function actualizar_display_temporizador(segundos){
  el.temporizador().textContent = seg_a_hms(segundos);
}

// ============================================================
// Iniciar el temporizador
function iniciar_temporizador(){
  const nombre = el.nombre_tarea().value.trim();

  // Validación de nombre
  if(!nombre){
    alert("Escribe el nombre de la tarea antes de iniciar.");
    return;
  }

  // Evita iniciar dos veces
  if(intervalo_temporizador) return;

  nombre_tarea_actual = nombre;
  el.tarea_actual().textContent = nombre_tarea_actual;

  // Cambiar estado de botones
  el.boton_iniciar().disabled = true;
  el.boton_pausar().disabled = false;
  el.boton_detener().disabled = false;

  // Guardar el momento en que se inicia
  marca_tiempo_inicio = Date.now();

  // Ejecutar actualización cada 250ms
  intervalo_temporizador = setInterval(() => {
    const ahora = Date.now();
    const segundos =
      Math.floor((ahora - marca_tiempo_inicio) / 1000) + tiempo_transcurrido_antes_pausa;
    actualizar_display_temporizador(segundos);
  }, 250);
}

// ============================================================
// Pausar el temporizador
function pausar_temporizador(){
  if(!intervalo_temporizador) return;

  clearInterval(intervalo_temporizador);
  intervalo_temporizador = null;

  // Calcular tiempo acumulado
  tiempo_transcurrido_antes_pausa += Math.floor((Date.now() - marca_tiempo_inicio) / 1000);
  marca_tiempo_inicio = null;

  // Cambiar estado de botones
  el.boton_iniciar().disabled = false;
  el.boton_pausar().disabled = true;
  el.boton_detener().disabled = false;
}

// ============================================================
// Detener el temporizador y guardar la tarea en historial
function detener_temporizador(){
  if(intervalo_temporizador){
    clearInterval(intervalo_temporizador);
    intervalo_temporizador = null;
  }

  // Calcular tiempo final
  const segundos_totales =
    tiempo_transcurrido_antes_pausa +
    (marca_tiempo_inicio ? Math.floor((Date.now() - marca_tiempo_inicio) / 1000) : 0);

  // Guardar registro si hay tiempo y nombre válido
  if(segundos_totales > 0 && nombre_tarea_actual){
    const historial = cargar_historial();
    historial.push({
      tarea: nombre_tarea_actual,
      segundos: segundos_totales,
      inicio_en: new Date().toISOString(),
    });
    guardar_historial(historial);
  }

  // Reset general del estado del temporizador
  tiempo_transcurrido_antes_pausa = 0;
  marca_tiempo_inicio = null;
  nombre_tarea_actual = "";
  el.tarea_actual().textContent = "—";
  actualizar_display_temporizador(0);

  // Estado de botones
  el.boton_iniciar().disabled = false;
  el.boton_pausar().disabled = true;
  el.boton_detener().disabled = true;

  // Re-render del historial
  renderizar_historial();
}

// ============================================================
// Conexión de botones al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  el.boton_iniciar().addEventListener("click", iniciar_temporizador);
  el.boton_pausar().addEventListener("click", pausar_temporizador);
  el.boton_detener().addEventListener("click", detener_temporizador);

  // Mostrar historial existente si lo hay
  renderizar_historial();
});