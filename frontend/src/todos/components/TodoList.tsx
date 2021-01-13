/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { addTodo, deleteTodo, toggleCompletedTodo } from '../../services/API';
import TodoItem from './TodoItem';
import AuthService from '../../services/auth-service';
import { useParams } from 'react-router-dom';
import Pusher from 'pusher-js';
import { TextField, Button } from '@material-ui/core';
import axios from 'axios';
import './TodoList.css';
import { Formik, Form } from 'formik';

interface Values {
  name: string;
  description: string;
}

const TodoList: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [listName, setListName] = useState('');
  const [todos, setTodos] = useState([]);

  let { id } = useParams<{ id: string }>();

  const submitTodo = (values: Values) => {
    addTodo(values, currentUser.username, id);
  };

  useEffect(() => {
    axios.get(`http://localhost:8080/api/todolists/${id}`).then((response) => {
      setListName(response.data.list.name);
    });

    axios
      .get(`http://localhost:8080/api/todoitems/list/${id}`)
      .then((response) => {
        setTodos(response.data.items);
      });
  }, []);

  useEffect(() => {
    const pusher = new Pusher('2619df95f428203c4d5b', {
      cluster: 'eu',
    });

    const listChannel = pusher.subscribe('todolists');
    listChannel.bind('updated', function (data: any) {
      axios
        .get(`http://localhost:8080/api/todoitems/${data.itemId}`)
        .then((response) => {
          setTodos([response.data.item, ...todos]);
        });
    });

    const itemsChannel = pusher.subscribe('todoitems');
    itemsChannel.bind('deleted', function (data: any) {
      console.log('DELETED');

      axios
        .get(`http://localhost:8080/api/todoitems/list/${id}`)
        .then((response) => {
          setTodos(response.data.items);
        });
    });

    itemsChannel.bind('updated', function (data: any) {
      console.log('UPDATED');

      axios
        .get(`http://localhost:8080/api/todoitems/list/${id}`)
        .then((response) => {
          setTodos(response.data.items);
        });
    });

    return () => {
      listChannel.unbind_all();
      listChannel.unsubscribe();
      itemsChannel.unbind_all();
      itemsChannel.unsubscribe();
    };
  }, [todos]);

  return (
    <div className="todolist-container">
      <h1 className="listHeader">{listName}</h1>
      <Formik
        initialValues={{ name: '', description: '' }}
        onSubmit={(values, { resetForm }) => {
          submitTodo(values);
          resetForm();
        }}
      >
        {({ values, handleChange, handleBlur }) => (
          <Form>
            <div>
              <TextField
                placeholder="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <TextField
                placeholder="Description"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <Button type="submit">Add</Button>
          </Form>
        )}
      </Formik>

      <ul className="todo-list">
        {todos.map((todo) => {
          return (
            <TodoItem
              key={todo._id}
              todo={todo}
              deleteTodo={deleteTodo}
              toggleCompletedTodo={toggleCompletedTodo}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default TodoList;
