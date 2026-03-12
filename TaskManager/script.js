let tasks = [];
let filter = 'all';

const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');

// 1. Add Task
addBtn.addEventListener('click', () => {
    if (taskInput.value.trim() === "") return;

    const newTask = {
        id: Date.now(),
        text: taskInput.value,
        priority: priorityInput.value,
        completed: false
    };

    tasks.push(newTask);
    taskInput.value = "";
    render();
});

// 2. Filter logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.getAttribute('data-filter');
        render();
    });
});

// 3. Render function (updates the UI)
function render() {
    taskList.innerHTML = "";

    const filtered = tasks.filter(t => {
        if (filter === 'completed') return t.completed;
        if (filter === 'pending') return !t.completed;
        return true;
    });

    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <span onclick="toggleTask(${task.id})">${task.text}</span>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
        `;
        taskList.appendChild(li);
    });
}

// 4. Helper functions
window.toggleTask = (id) => {
    tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
    render();
};

window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    render();
};