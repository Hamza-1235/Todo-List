const taskInput = document.querySelector('.task-input');
const descriptionInput = document.querySelector('.description-input');
const datetimeInput = document.querySelector('.datetime-input');
const addBtn = document.getElementById('btn');
const listContainer = document.querySelector('.list-to-do');

let currentTaskIndex = null; 
let gapiInited = false;
let gapiAuth = false;
let tokenClient;

const CLIENT_ID = '953162534165-f1i9jq2vrkmr8n306cvahur3b14qfdf7.apps.googleusercontent.com'; 
const API_KEY = 'AIzaSyB3c9ZbzcNrOfAp_UGUgkxp_joITyWIAPc'; 
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

function gapiInit() {
    gapi.load('client:auth2', async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: SCOPES,
        });
        gapiInited = true;
        console.log("Google API client initialized");
    });
}
function gapiLogin() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            gapi.auth.setToken(tokenResponse);
            gapiAuth = true;
        },
    });
    tokenClient.requestAccessToken();
}

window.onload = () => {
    gapiInit();
};

async function createGoogleCalendarEvent(task) {
    if (gapiAuth) {
        const event = {
            summary: task.text,
            description: task.description,
            start: {
                dateTime: task.dateTime,
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(new Date(task.dateTime).getTime() + 30 * 60000).toISOString(), // Set end time 30 minutes after start
                timeZone: 'UTC',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 10 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        try {
            const response = await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });
            console.log('Event created: ' + response.result.htmlLink);
        } catch (error) {
            console.error('Error creating event: ', error);
        }
    } else {
        alert('Please authenticate with Google Calendar first.');
    }
}


function newTask() {
    const taskText = taskInput.value.trim();
    const taskDescription = descriptionInput.value.trim();
    const taskDateTime = datetimeInput.value.trim();

    if (taskText !== "" && taskDateTime !== "") {
        const currentUser = localStorage.getItem('currentUser');
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};

        if (!tasks[currentUser]) {
            tasks[currentUser] = [];
        }

        const task = {
            text: taskText,
            description: taskDescription,
            dateTime: taskDateTime,
        };

        if (currentTaskIndex !== null) {
            tasks[currentUser][currentTaskIndex] = task;
            currentTaskIndex = null;
        } else {
            tasks[currentUser].push(task);
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasksForUser(currentUser);
        createGoogleCalendarEvent(task); 
        taskInput.value = '';
        descriptionInput.value = '';
        datetimeInput.value = '';
    }
}

addBtn.addEventListener('click', () => {
    if (!gapiAuth) {
        gapiLogin();
    }
    newTask();
});

window.onload = () => {
    gapiInit();
    authModal.style.display = 'block';
};


function saveTask() {
    if (currentTask) {
        const taskLabel = currentTask.querySelector('.task-label');
        const descriptionLabel = currentTask.querySelector('.description-label');
        const dateTimeLabel = currentTask.querySelector('.datetime-label');
        const newTask = taskInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        const newDateTime = datetimeInput.value.trim();

        if (newTask !== "" && newDateTime !== "") {
            taskLabel.textContent = newTask;
            descriptionLabel.textContent = newDescription;
            dateTimeLabel.textContent = newDateTime;

            const currentUser = localStorage.getItem('currentUser');
            const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
            const userTasks = tasks[currentUser] || [];

            const taskIndex = userTasks.findIndex(task => task.text === taskLabel.textContent && task.dateTime === dateTimeLabel.textContent);
            if (taskIndex !== -1) {
                userTasks[taskIndex] = {
                    text: newTask,
                    description: newDescription,
                    dateTime: newDateTime
                };
            }

            tasks[currentUser] = userTasks;
            localStorage.setItem('tasks', JSON.stringify(tasks));

            taskInput.value = '';
            descriptionInput.value = '';
            datetimeInput.value = '';
            currentTask.classList.remove('edit');
            currentTask = null;

            displayTasksForUser(currentUser);
        }
    }
}

function setReminder(taskText, taskDescription, taskDateTime) {
    const currentDateTime = new Date();
    const taskDateTimeObject = new Date(taskDateTime);

    const timeDifference = taskDateTimeObject - currentDateTime;

    if (timeDifference > 0) {
        setTimeout(() => {
            showReminder(taskText, taskDescription);
        }, timeDifference);
    } else {
        console.log("Task time has already passed.");
    }
}

function showReminder(taskText, taskDescription) {
    const reminderNotification = document.getElementById("reminderNotification");
    const reminderText = document.getElementById('reminderText');

    reminderText.textContent = `Reminder: ${taskText}\nDescription: ${taskDescription}`;
    reminderNotification.style.display = 'block';

    reminderNotification.addEventListener('click', () => {
        reminderNotification.style.display = 'none';
    });

    setTimeout(() => {
        reminderNotification.style.display = 'none';
    }, 20000);
}

function displayTasksForUser(username) {
    listContainer.innerHTML = ''; 

    const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
    const userTasks = tasks[username] || [];

    userTasks.forEach((task, index) => {
        const taskContainer = document.createElement('div');
        taskContainer.className = 'task-container';

        const taskLabel = document.createElement('label');
        taskLabel.className = 'task-label';
        taskLabel.textContent = task.text;

        const taskHeader = document.createElement('div');
        taskHeader.className = 'task-header';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const descriptionLabel = document.createElement('div');
        descriptionLabel.className = 'description-label';
        descriptionLabel.textContent = task.description;

        const dateTimeLabel = document.createElement('p');
        dateTimeLabel.className = 'datetime-label';
        dateTimeLabel.textContent = task.dateTime;

        const [date, time] = task.dateTime.split('T');
        dateTimeLabel.textContent = `${date} ${time}`;

        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check check-icon';

        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash delete-icon';

        const editIcon = document.createElement('i');
        editIcon.className = 'fas fa-edit edit-icon';

        iconContainer.appendChild(checkIcon);
        iconContainer.appendChild(deleteIcon);
        iconContainer.appendChild(editIcon);
        taskHeader.appendChild(taskLabel);
        taskHeader.appendChild(iconContainer);
        taskContainer.appendChild(taskHeader);
        taskContainer.appendChild(descriptionLabel);
        taskContainer.appendChild(dateTimeLabel);

        checkIcon.addEventListener('click', () => {
            taskContainer.classList.toggle('completed');
        });

        deleteIcon.addEventListener('click', () => {
            deleteTask(username, task);
        });

        editIcon.addEventListener('click', () => {
            taskContainer.classList.add('edit');
            taskInput.value = taskLabel.textContent;
            descriptionInput.value = descriptionLabel.textContent;
            datetimeInput.value = task.dateTime;
            taskInput.focus();
            currentTask = taskContainer; 
            currentTaskIndex = index; 
        });

        setReminder(task.text, task.description, task.dateTime);

        listContainer.appendChild(taskContainer);
    });
}

function deleteTask(username, taskToDelete) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
    const userTasks = tasks[username] || [];

    const updatedTasks = userTasks.filter(task => 
        task.text !== taskToDelete.text || 
        task.description !== taskToDelete.description || 
        task.dateTime !== taskToDelete.dateTime
    );

    tasks[username] = updatedTasks;
    localStorage.setItem('tasks', JSON.stringify(tasks));

    displayTasksForUser(username);
}

addBtn.addEventListener('click', newTask);

const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const toggleAuth = document.getElementById('toggleAuth');
const todoListContainer = document.querySelector('.todo-list-container');

let users = JSON.parse(localStorage.getItem('users')) || {};
let isLoginMode = true;

toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Login' : 'Sign up';
    authSubmit.textContent = isLoginMode ? 'Login' : 'Sign up';
    toggleAuth.innerHTML = isLoginMode ? "Don't have an account? <a href='#'>Sign up</a>" : "Already have an account? <a href='#'>Login</a>";
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (isLoginMode) {
        if (users[username] && users[username] === password) {
            localStorage.setItem('currentUser', username);
            alert('Login successful');
            authModal.style.display = 'none';
            todoListContainer.style.display = 'block';
            displayTasksForUser(username); 
        } else {
            alert('Invalid username or password');
        }
    } else {
        if (users[username]) {
            alert('Username already exists');
        } else {
            users[username] = password;
            localStorage.setItem('users', JSON.stringify(users));
            alert('Signup successful');
            isLoginMode = true;
            authTitle.textContent = 'Login';
            authSubmit.textContent = 'Login';
            toggleAuth.innerHTML = "Don't have an account? <a href='#'>Sign up</a>";
        }
    }
});

document.querySelector('.close').addEventListener('click', () => {
    authModal.style.display = 'none';
});

window.onload = () => {
    authModal.style.display = 'block';
};

addBtn.addEventListener('click', newTask);