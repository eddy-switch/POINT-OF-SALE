const mysql = require('mysql2/promise');
const faker = require('faker/locale/es_MX');
const productosAbarrotes = require('./datosProductos');

// Configuración de conexión
const config = {
  host: 'localhost',
  user: 'root',
  password: '020718',
  database: 'sistema_ventas',
  port: 3307, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Objeto para registrar resultados
const resultados = {
  proveedores: { exitoso: false, registros: 0, error: null },
  usuarios: { exitoso: false, registros: 0, error: null },
  productos: { exitoso: false, registros: 0, error: null },
  ventas: { exitoso: false, registros: 0, error: null },
  detalle_ventas: { exitoso: false, registros: 0, error: null }
};

async function main() {
  let connection;
  try {
    // Crear pool de conexiones
    const pool = mysql.createPool(config);
    connection = await pool.getConnection();
    
    console.log(' Conexión establecida');

    // Ejecutar inserciones en secuencia
    await insertarProveedores(connection, 100) //parametro para proveedores
      .catch(e => {
        resultados.proveedores.error = e.message;
        throw e;
      });

    await insertarUsuarios(connection)
      .catch(e => {
        resultados.usuarios.error = e.message;
        throw e;
      });

    await insertarProductos(connection) 
      .catch(e => {
        resultados.productos.error = e.message;
        throw e;
      });

    // Solo insertar ventas si todo lo anterior fue exitoso
    await insertarVentas(connection, 500) //CAMPO PARA MODIFICAR LAS VENTAS
      .catch(e => resultados.ventas.error = e.message);

    // Mostrar resultados detallados
    console.log('\n Resultados:');
    for (const [tabla, resultado] of Object.entries(resultados)) {
      const estado = resultado.exitoso ? 'Correct' : 'Failed';
      console.log(`${estado} ${tabla}: ${resultado.registros} registros`);
      if (resultado.error) console.log(`   Error: ${resultado.error}`);
    }

  } catch (error) {
    console.error(' Error general:', error.message);
  } finally {
    if (connection) await connection.release();
    if (pool) await pool.end();
  }
}

// Función para insertar proveedores
async function insertarProveedores(conn, cantidad) {
  try {
    const [existentes] = await conn.query('SELECT COUNT(*) as count FROM proveedores');
    if (existentes[0].count > 0) {
      resultados.proveedores.exitoso = true;
      resultados.proveedores.registros = existentes[0].count;
      console.log(`Proveedores ya existen: ${existentes[0].count} registros`);
      return;
    }

    const proveedores = Array.from({ length: cantidad }, () => [
      faker.company.companyName(),
      faker.phone.phoneNumber('55########'),
      faker.address.streetAddress()
    ]);

    const [result] = await conn.query(
      'INSERT INTO proveedores (nombre, telefono, direccion) VALUES ?',
      [proveedores]
    );
    
    resultados.proveedores.exitoso = true;
    resultados.proveedores.registros = result.affectedRows;
    console.log(`Proveedores insertados: ${result.affectedRows}`);
  } catch (error) {
    console.error('Error insertando proveedores:', error.message);
    throw error;
  }
}

// Función para insertar usuarios
async function insertarUsuarios(conn) {
  try {
    const [existentes] = await conn.query('SELECT COUNT(*) as count FROM usuarios');
    if (existentes[0].count > 0) {
      resultados.usuarios.exitoso = true;
      resultados.usuarios.registros = existentes[0].count;
      console.log(`Usuarios ya existen: ${existentes[0].count} registros`);
      return;
    }

    const usuarios = [
      // Administradores (2)
      [
        faker.name.firstName(),
        faker.name.lastName(),
        faker.name.lastName(),
        'admin1',
        '12345678',  // Contraseña de 8 dígitos
        'administrador'
      ],
      [
        faker.name.firstName(),
        faker.name.lastName(),
        faker.name.lastName(),
        'admin2',
        '87654321',  // Contraseña de 8 dígitos
        'administrador'
      ],
      // Cajeros (3)
      [
        faker.name.firstName(),
        faker.name.lastName(),
        faker.name.lastName(),
        'cajero1',
        '11111111',  // Contraseña de 8 dígitos
        'cajero'
      ],
      [
        faker.name.firstName(),
        faker.name.lastName(),
        faker.name.lastName(),
        'cajero2',
        '22222222',  // Contraseña de 8 dígitos
        'cajero'
      ],
      [
        faker.name.firstName(),
        faker.name.lastName(),
        faker.name.lastName(),
        'cajero3',
        '33333333',  // Contraseña de 8 dígitos
        'cajero'
      ]
    ];

    const [result] = await conn.query(
      'INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, usuario, contrasena, rol) VALUES ?',
      [usuarios]
    );
    
    resultados.usuarios.exitoso = true;
    resultados.usuarios.registros = result.affectedRows;
    console.log(` Usuarios insertados: ${result.affectedRows} (2 administradores y 3 cajeros)`);
  } catch (error) {
    console.error('Error insertando usuarios:', error.message);
    throw error;
  }
}

// Función para insertar productos 
async function insertarProductos(conn) {
  try {
    const [existentes] = await conn.query('SELECT COUNT(*) as count FROM productos');
    if (existentes[0].count > 0) {
      resultados.productos.exitoso = true;
      resultados.productos.registros = existentes[0].count;
      console.log(` Productos ya existen: ${existentes[0].count} registros`);
      return;
    }

    if (!productosAbarrotes || !Array.isArray(productosAbarrotes)) {
      throw new Error('Los datos de productos no se cargaron correctamente');
    }

    const [proveedores] = await conn.query('SELECT id_proveedor FROM proveedores');
    if (!proveedores.length) throw new Error('No hay proveedores registrados');
    
    const cantidadTotal = productosAbarrotes.length;
    console.log(` Insertando ${cantidadTotal} productos...`);
    
    const productos = [];
    
    for (let i = 0; i < cantidadTotal; i++) {
      const precioCompra = faker.commerce.price(5, 50);
      const margen = 1 + (Math.random() * 0.5);
      
      productos.push([
        productosAbarrotes[i],
        faker.random.alphaNumeric(13),
        precioCompra,
        Number((precioCompra * margen).toFixed(2)),
        Math.floor(Math.random() * 100),
        proveedores[Math.floor(Math.random() * proveedores.length)].id_proveedor
      ]);
    }

    const [result] = await conn.query(
      'INSERT INTO productos (nombre, codigo_barras, precio_compra, precio_venta, existencia, id_proveedor) VALUES ?',
      [productos]
    );
    
    resultados.productos.exitoso = true;
    resultados.productos.registros = result.affectedRows;
    console.log(` Productos insertados: ${result.affectedRows} (todos los ${cantidadTotal} productos)`);
  } catch (error) {
    console.error('Error insertando productos:', error.message);
    throw error;
  }
}

// Función para insertar ventas y detalles
async function insertarVentas(conn, cantidad) {
  try {
    const [existentes] = await conn.query('SELECT COUNT(*) as count FROM ventas');
    if (existentes[0].count > 0) {
      resultados.ventas.exitoso = true;
      resultados.ventas.registros = existentes[0].count;
      console.log(`Ventas ya existen: ${existentes[0].count} registros`);
      return;
    }

    const [productos] = await conn.query('SELECT id_producto, precio_venta FROM productos');
    const [empleados] = await conn.query('SELECT id_empleado FROM usuarios WHERE rol = "cajero"');
    
    if (!productos.length) throw new Error('No hay productos registrados');
    if (!empleados.length) throw new Error('No hay cajeros registrados');

    let ventasInsertadas = 0;
    let detallesInsertados = 0;

    await conn.beginTransaction();

    try {
      for (let i = 0; i < cantidad; i++) {
        const fechaVenta = faker.date.between('2023-01-01', new Date());
        
        const [venta] = await conn.query(
          'INSERT INTO ventas (fecha, total, id_empleado) VALUES (?, ?, ?)',
          [
            fechaVenta,
            0,
            empleados[Math.floor(Math.random() * empleados.length)].id_empleado
          ]
        );
        ventasInsertadas++;

        let totalVenta = 0;
        // Modificado para generar entre 1 y 3 productos por venta (promedio ~2)
        const numProductos = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < numProductos; j++) {
          const producto = productos[Math.floor(Math.random() * productos.length)];
          const cantidad = Math.floor(Math.random() * 3) + 1; // Entre 1 y 3 unidades por producto
          const subtotal = producto.precio_venta * cantidad;
          
          await conn.query(
            'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
            [venta.insertId, producto.id_producto, cantidad, producto.precio_venta, subtotal]
          );
          detallesInsertados++;
          totalVenta += subtotal;
        }

        await conn.query('UPDATE ventas SET total = ? WHERE id_venta = ?', [totalVenta, venta.insertId]);
      }
      
      await conn.commit();
      
      resultados.ventas.exitoso = true;
      resultados.ventas.registros = ventasInsertadas;
      resultados.detalle_ventas.exitoso = true;
      resultados.detalle_ventas.registros = detallesInsertados;
      
      console.log(` Ventas insertadas: ${ventasInsertadas}`);
      console.log(` Detalles de venta insertados: ${detallesInsertados}`);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error insertando ventas:', error.message);
    throw error;
  }
}

main();





