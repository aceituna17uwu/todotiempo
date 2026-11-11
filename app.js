// FAVOR DE COMENTAR TODO LO Q LE VAYAN A MOVER PORFA!!!

const SUPABASE_URL = "https://buszywrkxzsjvcdscfdx.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3p5d3JreHpzanZjZHNjZmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTg5OTIsImV4cCI6MjEwNTI3NDk5Mn0.XSVFlyLUrB9u_VxcL1bKJuTbUPZPgVE8AUVR38Vrpy8"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

// --- Detección de estación, mi idea con esto era q en base a la estacion 
// q estemos cambien los colores y las sugerencias por temporada ---
function aplicarEstacion() {
  const mes = new Date().getMonth() + 1; // 1-12
  let estacion = 'otono'; // tamos en otoño
  
  if (mes >= 3 && mes <= 5) estacion = 'primavera';
  else if (mes >= 6 && mes <= 8) estacion = 'verano';
  else if (mes >= 9 && mes <= 11) estacion = 'otono';
  else estacion = 'invierno';
// className para sobreescribir cualquier otra clase jeje
  document.body.className = estacion; 
  return estacion; 
}
const estacionActual = aplicarEstacion();

function mostrarAviso(texto, tipo) {   
  const aviso = document.getElementById("aviso");   
  if (!aviso) return;   
  aviso.textContent = texto;   
  aviso.className = "aviso visible " + tipo;   
}

function traducirError(mensaje) {   
  if (mensaje.includes("Invalid login credentials")) return "El correo o la contraseña no coinciden.";   
  if (mensaje.includes("already registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";   
  if (mensaje.includes("at least 6 characters")) return "La contraseña necesita al menos 6 caracteres.";   
  if (mensaje.includes("Email not confirmed")) return "Falta confirmar el correo. Revisa la bandeja de entrada.";   
  return "Algo falló: " + mensaje; 
}

// --- AUTENTICACIÓN DE SUPABASE ---
const formRegistro = document.getElementById("form-registro"); 
if (formRegistro) {   
  formRegistro.addEventListener("submit", async function (evento) {     
    evento.preventDefault();                    
    const boton = document.getElementById("btn-registrar");     
    boton.disabled = true;     
    boton.textContent = "Creando...";     
    
    const { data, error } = await db.auth.signUp({       
      email: document.getElementById("correo").value.trim(),       
      password: document.getElementById("contraseña").value,       
      options: {         
        data: {           
          nombre: document.getElementById("nombre").value.trim(),           
          usuario: document.getElementById("usuario").value.trim()         
        }       
      }     
    });     
    
    boton.disabled = false;     
    boton.textContent = "Crear cuenta";     
    
    if (error) {       
      mostrarAviso(traducirError(error.message), "error");       
      return;     
    }     
    mostrarAviso("Cuenta creada exitosamente. Redirigiendo...", "exito");     
    setTimeout(() => window.location.href = "login.html", 1500);   
  }); 
}

const formLogin = document.getElementById("form-login"); 
if (formLogin) {   
  formLogin.addEventListener("submit", async function (evento) {     
    evento.preventDefault();     
    const boton = document.getElementById("btn-entrar");     
    boton.disabled = true;     
    boton.textContent = "Verificando...";

    const { data, error } = await db.auth.signInWithPassword({       
      email: document.getElementById("correo").value.trim(),       
      password: document.getElementById("contraseña").value     
    });     
    
    boton.disabled = false;     
    boton.textContent = "Entrar";     
    
    if (error) {       
      mostrarAviso(traducirError(error.message), "error");       
      return;     
    }     
    window.location.href = "catalogo.html";   
  }); 
}

const btnCancelar = document.getElementById("btn-cancelar"); 
if (btnCancelar) {   
  btnCancelar.addEventListener("click", function () {     
    document.querySelectorAll("input").forEach(campo => campo.value = "");     
    const aviso = document.getElementById("aviso");     
    if (aviso) aviso.className = "aviso";   
  }); 
}

const etiquetaNombre = document.getElementById("nombre-usuario"); 
if (etiquetaNombre) {   
  (async function () {     
    const { data } = await db.auth.getSession();     
    if (!data.session) {       
      window.location.href = "login.html";       
      return;     
    }     
    const usuario = data.session.user;     
    etiquetaNombre.textContent = usuario.user_metadata.nombre || usuario.email;   
  })(); 
}

const btnSalir = document.getElementById("btn-salir"); 
if (btnSalir) {   
  btnSalir.addEventListener("click", async function (evento) {     
    evento.preventDefault();     
    await db.auth.signOut();     
    window.location.href = "login.html";   
  }); 
}

// --- CATÁLOGO Y FILTROS SUPABASE ---
async function renderizarCatalogo(estacionFiltro = null) {
  const contenedorCatalogo = document.getElementById("contenedor-ropa");
  if (!contenedorCatalogo) return;

  contenedorCatalogo.innerHTML = "<p>Cargando catálogo...</p>";

  // Consulta d productos
  let query = db.from('productos').select('*');
  
  // que filtro se aplica
  let filtroAplicar = estacionFiltro || estacionActual;
  
  // Si no es "todas", filtrarr por la estación específica
  if (filtroAplicar !== 'todas') {
     query = query.eq('estacion', filtroAplicar);
  }

  const { data: productos, error } = await query;

  if (error) {
    console.error("Error al cargar productos de Supabase:", error.message);
    contenedorCatalogo.innerHTML = "<p>Ocurrió un error al cargar el catálogo desde la nube.</p>";
    return;
  }

  contenedorCatalogo.innerHTML = "";

  if (!productos || productos.length === 0) {
    contenedorCatalogo.innerHTML = "<p>No hay productos disponibles.</p>";
    return;
  }

  // HTML por producto, se generan aqui mismo
  productos.forEach(producto => {
    const imagenUrl = producto.imagen_url.replace('otoño', 'oto o'); 

    const tarjetaHTML = `
      <div class="tarjeta-producto">
        <div class="imagen-contenedor">
          <img src="${imagenUrl}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/200x250?text=Imagen+No+Encontrada'">
        </div>
        <div class="info-producto">
          <h3>${producto.nombre}</h3>
          <p class="precio">$${producto.precio.toFixed(2)}</p>
          <button class="btn-agregar">Agregar al Carrito</button>
        </div>
      </div>
    `;
    contenedorCatalogo.innerHTML += tarjetaHTML;
  });
}

// --- BOTONES DE FILTRO ---
function configurarFiltros() {
  const botonesFiltro = document.querySelectorAll('.btn-filtro');
  if (botonesFiltro.length === 0) return;

  // Marcar el botón de la estación actual al cargar la página
  botonesFiltro.forEach(btn => {
    if (btn.dataset.estacion === estacionActual) {
      btn.classList.add('activo');
    }
  });

  botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
      // Quitar la clase 'activo' de todos los botones
      botonesFiltro.forEach(btn => btn.classList.remove('activo'));
      
      // Agregar la clase 'activo' al botón clickeado
      e.target.classList.add('activo');
      
      const estacionSeleccionada = e.target.dataset.estacion;
      
      // Cambiar el color de toda la página para que combine con la estación 
      if(estacionSeleccionada !== 'todas') {
         document.body.className = estacionSeleccionada;
      } else {
         document.body.className = estacionActual; // Si elige "todas", regresa al color de la estación actual :3
      }

      // descargar los productos filtrados otravez
      renderizarCatalogo(estacionSeleccionada);
    });
  });
}

if (window.location.pathname.includes('catalogo.html')) {
  document.addEventListener('DOMContentLoaded', () => {
     renderizarCatalogo();
     configurarFiltros();
  });
}
