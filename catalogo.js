//aqui se carga el app.js
(async function () {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

//esto carga los productos
  const contenedor = document.getElementById("productos");
  if (!contenedor) return;

  const estacion = contenedor.dataset.estacion;

  const { data: productos, error } = await db
    .from("productos")
    .select("*")
    .eq("estacion", estacion)
    .order("nombre");

  if (error) {
    console.error(error);
    contenedor.innerHTML = "<p class='vacio'>No se pudo cargar el catálogo.</p>";
    return;
  }

  if (productos.length === 0) {
    contenedor.innerHTML = "<p class='vacio'>Aún no hay prendas en esta estación.</p>";
    return;
  }

  contenedor.innerHTML = productos.map(function (p) {
    return `
      <article class="tarjeta">
        <img src="${p.imagen_url}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p class="categoria">${p.categoria ?? ""}</p>
        <p class="precio">$${Number(p.precio).toFixed(2)}</p>
      </article>`;
  }).join("");
})();