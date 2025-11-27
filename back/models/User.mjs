import { DataTypes, Model } from 'sequelize'
import { sequelize } from "../config/db.mjs"

export class User extends Model {}

User.init({
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: "El nombre no puede estar vacío"
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: "Coloque un email válido"
      }
    }
  },
  hash: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  isActivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activateToken: {
    type: DataTypes.STRING
  }
  ,
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['admin', 'employee', 'user']],
        msg: 'Role inválido'
      }
    }
  }
}, {
  tableName: "users",
  sequelize
})