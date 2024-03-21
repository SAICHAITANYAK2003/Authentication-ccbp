const express = require('express')

const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'userData.db')

let database = null

const initializeserver = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}

initializeserver()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashedPassword = await bcrypt.hash(password, 10)
  const selectuserQuery = `SELECT * FROM user WHERE username='${username}';`
  const databaseUser = await database.get(selectuserQuery)
  if (databaseUser === undefined) {
    const createUserQuery = `
    INSERT INTO
     user (username, name, password, gender, location)
     VALUES
     (
     '${username}',
      '${name}',
      '${password}',
      '${hashedPassword}',
      '${gender}',
      '${location}');
      `;
    if (password.length > 4) {
      await database.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectuserQuery = `SELECT * FROM user WHERE username=${username};`
  const databaseUser = await database.get(selectuserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatch === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectuserQuery = `
  SELECT * FROM user WHERE username=${username};`
  const databaseUser = await database.get(selectuserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatch === true) {
      if (password.length > 4) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatepasswordquery = `
        UPDATE user SET password=${hashedPassword}
        WHERE 
        username=${username};`
        const user = await database.run(updatepasswordquery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
