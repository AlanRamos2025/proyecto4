import { Sequelize } from "sequelize"
import dotenv from "dotenv"

dotenv.config()

const config = {
  database: process.env.NAME_DB || 'stock_utn',
  username: process.env.USER_DB || 'root',
  password: process.env.PASS_DB || '',
  options: {
    host: process.env.HOST_DB || 'localhost',
    port: process.env.PORT_DB ? Number(process.env.PORT_DB) : 3306,
    dialect: process.env.DIALECT_DB || 'mysql',
    logging: console.log // ← CAMBIADO A true para ver errores
  }
}

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config.options,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)