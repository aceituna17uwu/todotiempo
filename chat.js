// Requiere que app.js se cargue antes (ahí se crea "db")
(async function () {
  // 1) Protección: sin sesión, al login
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
  const yaPintados = new Set(); // evita duplicar mensajes (historial + tiempo real)

  function pintar(m) {
    if (yaPintados.has(m.id)) return;
    yaPintados.add(m.id);

    const vacio = lista.querySelector(".vacio");
    if (vacio) vacio.remove();

    const propio = m.user_id === usuario.id;

    const burbuja = document.createElement("div");
    burbuja.className = "burbuja " + (propio ? "mio" : "otro");

    const autor = document.createElement("span");
    autor.className = "autor";
    autor.textContent = propio ? "Tú" : m.autor || "Anónimo";

    const texto = document.createElement("p");
    texto.textContent = m.contenido; // textContent: nada de HTML inyectado

    const hora = document.createElement("time");
    hora.textContent = new Date(m.created_at).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });

    burbuja.append(autor, texto, hora);
    lista.appendChild(burbuja);
    lista.scrollTop = lista.scrollHeight;
  }

  // 2) Historial (últimos 100 mensajes)
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

  // 3) Mensajes nuevos en tiempo real
  db.channel("chat-todo-tiempo")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensajes" },
      function (payload) {
        pintar(payload.new);
      }
    )
    .subscribe();

  // 4) Enviar mensaje
  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const contenido = input.value.trim();
    if (!contenido) return;

    input.value = "";
    const { error: errorEnvio } = await db
      .from("mensajes")
      .insert({ contenido: contenido, autor: miNombre });

    if (errorEnvio) {
      console.error(errorEnvio);
      input.value = contenido; // devolver el texto para no perderlo
      alert("No se pudo enviar el mensaje. Intenta de nuevo.");
    }
  });
})();
