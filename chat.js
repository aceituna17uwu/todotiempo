const RESPUESTA_BASE = "¡Gracias por escribir a Todo Tiempo! Un asesor te responderá pronto.";
const RESPUESTAS = [
  { palabras: ["hola", "buenas", "buen dia", "buenos dias", "buenas tardes"], texto: "¡Hola! Bienvenido a Todo Tiempo. ¿En qué te podemos ayudar?" },
  { palabras: ["precio", "cuesta", "costo", "cuanto"], texto: "El precio aparece debajo de cada prenda en el catálogo." },
  { palabras: ["talla", "medida"], texto: "Manejamos tallas CH, M y G. Dinos cuál prenda te interesa." },
  { palabras: ["envio", "entrega", "domicilio"], texto: "Hacemos envíos a todo el país en 3 a 5 días hábiles." }
];

function buscarRespuesta(texto) {
  const limpio = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const r of RESPUESTAS) {
    if (r.palabras.some(function (p) { return limpio.includes(p); })) return r.texto;
  }
  return null;
}

(async function () {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const usuario = data.session.user;
  const miNombre =
    usuario.user_metadata.usuario || usuario.user_metadata.nombre || usuario.email;

  const lista = document.getElementById("mensajes");
  const form = document.getElementById("form-chat");
  const input = document.getElementById("texto");
  const yaPintados = new Set();
  let primerMensaje = true;

  function crearBurbuja(clase, nombre, contenido, fecha) {
    const vacio = lista.querySelector(".vacio");
    if (vacio) vacio.remove();

    const burbuja = document.createElement("div");
    burbuja.className = "burbuja " + clase;

    const autor = document.createElement("span");
    autor.className = "autor";
    autor.textContent = nombre;

    const texto = document.createElement("p");
    texto.textContent = contenido;

    const hora = document.createElement("time");
    hora.textContent = new Date(fecha).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });

    burbuja.append(autor, texto, hora);
    lista.appendChild(burbuja);
    lista.scrollTop = lista.scrollHeight;
  }

  function pintar(m) {
    if (yaPintados.has(m.id)) return;
    yaPintados.add(m.id);
    const propio = m.user_id === usuario.id;
    crearBurbuja(propio ? "mio" : "otro", propio ? "Tú" : m.autor || "Anónimo", m.contenido, m.created_at);
  }

  function pintarBot(contenido) {
    crearBurbuja("bot", "Todo Tiempo (automático)", contenido, new Date());
  }

  const { data: historial, error } = await db
    .from("mensajes")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error(error);
    lista.innerHTML = "<p class='vacio'>No se pudo cargar el chat. Recarga la página.</p>";
    return;
  }

  if (historial.length === 0) {
    lista.innerHTML = "<p class='vacio'>Aún no hay mensajes. Escribe el primero.</p>";
  }
  historial.forEach(pintar);

  db.channel("chat-todo-tiempo")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensajes" },
      function (payload) {
        pintar(payload.new);
      }
    )
    .subscribe();

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const contenido = input.value.trim();
    if (!contenido) return;

    input.value = "";
    const { data: fila, error: errorEnvio } = await db
      .from("mensajes")
      .insert({ contenido: contenido, autor: miNombre })
      .select()
      .single();

    if (errorEnvio) {
      console.error(errorEnvio);
      input.value = contenido;
      alert("No se pudo enviar el mensaje. Intenta de nuevo.");
      return;
    }

    pintar(fila);

    const respuesta = buscarRespuesta(contenido) || (primerMensaje ? RESPUESTA_BASE : null);
    primerMensaje = false;
    if (respuesta) setTimeout(function () { pintarBot(respuesta); }, 900);
  });
})();
