const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '020718',
  database: 'sistema_ventas',
  port: 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const registrarVenta = async (req, res) => {
  const { id_venta, total, detalles } = req.body;
  const fecha = new Date();
  const id_empleado = 6// Considera hacer esto dinámico

  if (!detalles || detalles.length === 0) {
    return res.status(400).json({ error: 'No hay productos en la venta' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Registrar la venta principal
    await conn.query(
      'INSERT INTO ventas (id_venta, fecha, total, id_empleado) VALUES (?, ?, ?, ?)',
      [id_venta, fecha, total, id_empleado]
    );

    // 2. Registrar cada detalle de venta
    for (const item of detalles) {
      await conn.query(
        'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [
          id_venta,
          item.id_producto,
          item.cantidad,
          item.precio_unitario,
          item.cantidad * item.precio_unitario
        ]
      );

      // 3. (Opcional) Actualizar el stock
      await conn.query(
        'UPDATE productos SET existencia = existencia - ? WHERE id_producto = ?',
        [item.cantidad, item.id_producto]
      );
    }

    await conn.commit();
    res.status(201).json({ mensaje: 'Venta registrada con éxito', id_venta });

  } catch (error) {
    await conn.rollback();
    console.error('Error al registrar venta:', error);
    res.status(500).json({ error: 'Error al registrar la venta: ' + error.message });
  } finally {
    conn.release();
  }
};

module.exports = { registrarVenta};

