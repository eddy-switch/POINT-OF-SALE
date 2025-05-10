const mysql = require("mysql2/promise");

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "020718", //coloca tu contraseña de tu MySql
  database: "sistema_ventas", //Nombramiento de tu Base de datos
  port: 3307, //Puerto
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  //manda "crarProducto" a routes/productos.js

  const {
    nombre,
    codigo_barras,
    precio_compra,
    precio_venta,
    existencia,
    id_proveedor,
  } = req.body;

  // Validación
  if (!nombre || !codigo_barras) {
    return res
      .status(400)
      .json({ error: "Nombre y código de barras son obligatorios" });
  }

  if (
    isNaN(precio_compra) ||
    isNaN(precio_venta) ||
    isNaN(existencia) ||
    isNaN(id_proveedor)
  ) {
    return res
      .status(400)
      .json({ error: "Los campos numéricos deben ser valores válidos" });
  }

  try {
    const connection = await pool.getConnection();

    // Verificar si el proveedor existe
    const [proveedor] = await connection.query(
      "SELECT id_proveedor FROM proveedores WHERE id_proveedor = ?",
      [id_proveedor]
    );

    if (proveedor.length === 0) {
      connection.release();
      return res.status(400).json({
        error: "El proveedor especificado no existe",
        id_proveedor_no_encontrado: id_proveedor,
      });
    }

    // Verificar si el código de barras ya existe
    const [existing] = await connection.query(
      "SELECT id_producto FROM productos WHERE codigo_barras = ?",
      [codigo_barras]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: "El código de barras ya existe" });
    }

    // Insertar el nuevo producto
    const [result] = await connection.query(
      `INSERT INTO productos 
            (nombre, codigo_barras, precio_compra, precio_venta, existencia, id_proveedor) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        codigo_barras,
        parseFloat(precio_compra),
        parseFloat(precio_venta),
        parseInt(existencia),
        parseInt(id_proveedor),
      ]
    );

    connection.release();

    res.status(201).json({
      id_producto: result.insertId,
      nombre,
      codigo_barras,
      precio_compra: parseFloat(precio_compra),
      precio_venta: parseFloat(precio_venta),
      existencia: parseInt(existencia),
      id_proveedor: parseInt(id_proveedor),
      mensaje: "Producto creado exitosamente",
    });
  } catch (error) {
    console.error("Error al insertar producto:", error);
    res.status(500).json({
      error: "Error al guardar el producto",
      detalles:
        process.env.NODE_ENV === "development"
          ? {
              mensaje: error.message,
              codigo: error.code,
              sqlState: error.sqlState,
            }
          : undefined,
    });
  }
};

//Obtener un producto por ID
exports.obtenerProducto = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    
    if (searchTerm.length < 2) {
      return res.json([]);
    }

    console.log('Ejecutando consulta para:', searchTerm); // Log para depuración
    
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT id_producto, nombre, precio_venta, codigo_barras, precio_compra, existencia, id_proveedor
       FROM productos 
       WHERE nombre LIKE CONCAT('%', ?, '%')
       LIMIT 5`,
      [searchTerm]
    );
    
    connection.release();

    console.log('Resultados encontrados:', rows.length); // Log para depuración
    
    res.json(rows);
  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      details: error.message,
      sqlError: error.sqlMessage 
    });
  }
};

// Actualizar un producto existente
exports.actualizarProducto = async (req, res) => {
  //exporta a routes/productos.js
  const { id } = req.params;
  const {
    nombre,
    codigo_barras,
    precio_compra,
    precio_venta,
    existencia,
    id_proveedor,
  } = req.body;

  // Validación básica
  if (
    !nombre ||
    !codigo_barras ||
    !precio_compra ||
    !precio_venta ||
    !existencia ||
    !id_proveedor
  ) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `UPDATE productos SET 
            nombre = ?, 
            codigo_barras = ?, 
            precio_compra = ?, 
            precio_venta = ?, 
            existencia = ?, 
            id_proveedor = ? 
            WHERE id_producto = ?`,
      [
        nombre,
        codigo_barras,
        precio_compra,
        precio_venta,
        existencia,
        id_proveedor,
        id,
      ]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const productoActualizado = {
      id_producto: parseInt(id),
      nombre,
      codigo_barras,
      precio_compra: parseFloat(precio_compra),
      precio_venta: parseFloat(precio_venta),
      existencia: parseInt(existencia),
      id_proveedor: parseInt(id_proveedor),
    };

    res.status(200).json(productoActualizado);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar el producto en la base de datos" });
  }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();

    // Primero eliminar los detalles de venta relacionados
    await connection.query(`DELETE FROM detalle_ventas WHERE id_producto = ?`, [
      id,
    ]);

    // Luego eliminar el producto
    const [result] = await connection.query(
      `DELETE FROM productos WHERE id_producto = ?`,
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      error: "Error al eliminar el producto de la base de datos",
      detalles:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Listar todos los productos
exports.listarProductos = async (req, res) => {
  //exporta a routes/productos.js
  try {
    const connection = await pool.getConnection();
        res.setHeader('Content-Type', 'application/json'); // ← Añade esto


    const [rows] = await connection.query(`SELECT * FROM productos`);

    connection.release();

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al listar productos:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los productos de la base de datos" });
  }
};

