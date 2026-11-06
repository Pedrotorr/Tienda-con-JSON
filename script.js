var productos = [];
var carrito = JSON.parse(localStorage.getItem("carrito")) || [];
var categoriaActual = "Todas";
var temporizador;

function mostrarPrecio(precio) {
    return precio.toFixed(2) + " €";
}

function buscarProducto(id) {
    for (var i = 0; i < productos.length; i++) {
        if (productos[i].id === id) return productos[i];
    }
    return null;
}

function buscarEnCarrito(id) {
    for (var i = 0; i < carrito.length; i++) {
        if (carrito[i].id === id) return carrito[i];
    }
    return null;
}

function mostrarProductos() {
    var lista = [];
    var html = "";
    var texto = document.getElementById("buscador").value.toLowerCase();
    var orden = document.getElementById("ordenar").value;

    for (var i = 0; i < productos.length; i++) {
        var producto = productos[i];
        var coincideCategoria = categoriaActual === "Todas" ||
            producto.category === categoriaActual;
        var coincideTexto = producto.name.toLowerCase().indexOf(texto) !== -1 ||
            producto.description.toLowerCase().indexOf(texto) !== -1;

        if (producto.stock > 0 && coincideCategoria && coincideTexto) {
            lista.push(producto);
        }
    }

    if (orden === "precio-asc") {
        lista.sort(function (a, b) { return a.price - b.price; });
    } else if (orden === "precio-desc") {
        lista.sort(function (a, b) { return b.price - a.price; });
    } else if (orden === "stock-asc") {
        lista.sort(function (a, b) { return a.stock - b.stock; });
    } else if (orden === "stock-desc") {
        lista.sort(function (a, b) { return b.stock - a.stock; });
    } else if (orden === "nombre") {
        lista.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    for (var j = 0; j < lista.length; j++) {
        var producto = lista[j];
        html += '<article class="producto">';
        html += '<p class="etiqueta">' + producto.category + '</p>';
        html += '<h3>' + producto.name + '</h3>';
        html += '<p class="descripcion">' + producto.description + '</p>';
        html += '<p class="stock">Disponibles: ' + producto.stock + '</p>';
        html += '<div class="pie-producto"><strong>' + mostrarPrecio(producto.price) + '</strong>';
        html += '<button onclick="anadir(' + producto.id + ')">Añadir a la cesta</button></div>';
        html += '</article>';
    }

    document.getElementById("productos").innerHTML =
        html || "No hay productos disponibles.";
}

function mostrarCategorias() {
    var categorias = ["Todas"];
    var html = "";

    for (var i = 0; i < productos.length; i++) {
        var nombre = productos[i].category;
        if (categorias.indexOf(nombre) === -1) {
            categorias.push(nombre);
        }
    }

    for (var j = 0; j < categorias.length; j++) {
        var activa = categoriaActual === categorias[j] ? "activa" : "";
        html += '<button class="categoria ' + activa +
            '" onclick="elegirCategoria(\'' + categorias[j] + '\')">' +
            categorias[j] + '</button>';
    }

    document.getElementById("categorias").innerHTML = html;
}

function elegirCategoria(nombre) {
    categoriaActual = nombre;
    mostrarCategorias();
    mostrarProductos();
}

function anadir(id) {
    var producto = buscarProducto(id);
    var articuloEnCarrito = buscarEnCarrito(id);

    if (articuloEnCarrito) {
        if (articuloEnCarrito.quantity >= producto.stock) {
            avisar("No quedan más unidades.");
            return;
        }
        articuloEnCarrito.quantity++;
    } else {
        carrito.push({
            id: producto.id,
            name: producto.name,
            price: producto.price,
            quantity: 1
        });
    }

    actualizarCarrito();
    avisar(producto.name + " añadido a la cesta.");
}

function cambiarCantidad(id, cambio) {
    var articulo = buscarEnCarrito(id);
    var producto = buscarProducto(id);

    if (articulo && cambio > 0 && producto &&
        articulo.quantity >= producto.stock) {
        avisar("No quedan más unidades.");
        return;
    }

    if (articulo) {
        articulo.quantity += cambio;
        if (articulo.quantity < 1) {
            carrito.splice(carrito.indexOf(articulo), 1);
        }
    }

    actualizarCarrito();
}

function eliminar(id) {
    var articulo = buscarEnCarrito(id);
    if (articulo) {
        carrito.splice(carrito.indexOf(articulo), 1);
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    var html = "";
    var cantidad = 0;
    var total = 0;

    for (var i = 0; i < carrito.length; i++) {
        var articulo = carrito[i];
        cantidad += articulo.quantity;
        total += articulo.price * articulo.quantity;

        html += '<div class="fila-carrito">';
        html += '<span>' + articulo.name + ' — ' + mostrarPrecio(articulo.price) + '</span>';
        html += '<div class="controles-cantidad">';
        html += '<button onclick="cambiarCantidad(' + articulo.id + ',-1)">−</button>';
        html += '<span>' + articulo.quantity + '</span>';
        html += '<button onclick="cambiarCantidad(' + articulo.id + ',1)">+</button>';
        html += '<button class="boton-secundario" onclick="eliminar(' +
            articulo.id + ')">Eliminar</button>';
        html += '</div></div>';
    }

    document.getElementById("contador-carrito").textContent = cantidad;
    document.getElementById("contenido-carrito").innerHTML =
        html || "Tu cesta está vacía.";
    document.getElementById("total-carrito").textContent = carrito.length
        ? "Total: " + mostrarPrecio(total)
        : "";

    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function avisar(texto) {
    var aviso = document.getElementById("aviso");
    aviso.textContent = texto;
    aviso.className = "aviso visible";
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
        aviso.className = "aviso";
    }, 3000);
}

document.getElementById("ordenar").onchange = mostrarProductos;
document.getElementById("buscador").oninput = mostrarProductos;

document.getElementById("boton-carrito").onclick = function () {
    var fondo = document.getElementById("fondo-carrito");
    fondo.hidden = !fondo.hidden;
};

document.getElementById("cerrar-carrito").onclick = function () {
    document.getElementById("fondo-carrito").hidden = true;
};

document.getElementById("finalizar-compra").onclick = function () {
    carrito = [];
    actualizarCarrito();
    document.getElementById("fondo-carrito").hidden = true;
    avisar("Compra finalizada. ¡Gracias!");
};

fetch("productos.json")
    .then(function (respuesta) { return respuesta.json(); })
    .then(function (datos) {
        productos = datos;
        mostrarCategorias();
        mostrarProductos();
        actualizarCarrito();
    })
    .catch(function (error) {
        console.log("Error al cargar productos:", error);
    });

fetch("userData.json")
    .then(function (respuesta) { return respuesta.json(); })
    .then(function (usuario) {
        document.getElementById("saludo").textContent =
            "¡Bienvenido/a, " + usuario.name + "!";
        document.getElementById("direccion-envio").textContent =
            "Enviando pedido a: " + usuario.name + ", " +
            usuario.address.street + ", " + usuario.address.city +
            " (" + usuario.address.zip + ")";
    })
    .catch(function (error) {
        console.log("Error al cargar el usuario:", error);
    });
