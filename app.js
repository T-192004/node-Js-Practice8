const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

let dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
}
initializeDBandServer()

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityPropery = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

//API 1

const getTodoListObject = dbObj => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
  }
}

app.get('/todos/?status=TO%20DO', async (request, response) => {
  let data = null
  let toDoQuery = ''
  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      toDoQuery = `
      SELECT 
        * 
      FROM
        todo
      WHERE 
        todo LIKE '%${search_q}%'
        AND priority LIKE '%${priority}%'
        AND status LIKE '%${status}%';
      `
      break
    case hasPriorityPropery(request.query):
      toDoQuery = `
      SELECT 
        * 
      FROM
        todo
      WHERE 
        todo LIKE '%${search_q}%'
        AND priority LIKE '%${priority}%'
      `
      break
    case hasStatusProperty(request.query):
      toDoQuery = `
        SELECT 
          * 
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status LIKE '%${status}%';
        `
      break
    default:
      toDoQuery = `
        SELECT 
          * 
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%'
        `
      break
  }
  const allToDoDetailsArray = await db.all(toDoQuery)
  response.send(
    allToDoDetailsArray.map(eachTodo => getTodoListObject(eachTodo)),
  )
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoID} = request.params
  const gettodoIdDetails = ` 
  SELECT 
    *
  FROM
    todo
  WHERE 
    id = ${todoID};
  `
  const todoDetailsResponse = await db.get(gettodoIdDetails)
  response.send(getTodoListObject(todoDetailsResponse))
})

// API 3

app.post('/todos/', async (request, response) => {
  const {todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO 
    todo (todo, priority, status)
  VALUES ('${todo}', '${priority}', '${status}');
  `
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

//API 4

app.put("/todos/:todoId/", async (request, response)=>{
  const {todoId} = request.params;
  const previousTodoQuery = `
  SELECT 
    *
  FROM
    todo  
  WHERE
    id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);
  
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status
  } = request.body;

  let updatedTodoQuery = "" 
  let responseStatus = "";

  switch (true){
  case todo !== previousTodo.todo :
    updatedTodoQuery = ` 
    UPDATE 
      todo
    SET 
      todo = '${todo}'
    WHERE
      id = ${todoId}
    `;
    responseStatus = "Todo Updated";
    break;
  case status !== previousTodo.status:
    updatedTodoQuery = ` 
    UPDATE 
      todo
    SET 
      status = '${status}'
    WHERE
      id = ${todoId}
    `;
    responseStatus = "Status Updated";
    break;
  case priority !== previousTodo.priority:
    updatedTodoQuery = ` 
    UPDATE 
      todo
    SET
      priority = '${priority}'
    WHERE
      id = ${todoId}
    `;
    responseStatus = "Priority Updated";
    break;
  
  }
  await db.run(updatedTodoQuery);
  response.send(responseStatus);

})

//API 5

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoDeleteQuery = `
  DELETE FROM
    todo
  WHERE 
    id = ${todoId};
  `
  await db.run(todoDeleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
