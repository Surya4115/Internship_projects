/* ============================================
   Premium To-Do List - Main JavaScript
   ============================================ */

// ============================================
// State Management
// ============================================

const STORAGE_KEY = 'premium-todo-tasks';
const THEME_KEY = 'premium-todo-theme';

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

// ============================================
// DOM Elements
// ============================================

const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');
const taskCategory = document.getElementById('task-category');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const greetingEl = document.getElementById('greeting');
const dateEl = document.getElementById('current-date');
const timeEl = document.getElementById('current-time');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completionPercentEl = document.getElementById('completion-percent');
const progressFill = document.getElementById('progress-fill');
const toastContainer = document.getElementById('toast-container');

// Confirm Modal
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

// Edit Modal
const editModal = document.getElementById('edit-modal');
const editTaskInput = document.getElementById('edit-task-input');
const editPriority = document.getElementById('edit-priority');
const editCategory = document.getElementById('edit-category');
const editCancel = document.getElementById('edit-cancel');
const editSave = document.getElementById('edit-save');

// ============================================
// Initialize App
// ============================================

function init() {
    loadTasks();
    loadTheme();
    renderTasks();
    updateStats();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    bindEvents();
}

// ============================================
// Event Bindings
// ============================================

function bindEvents() {
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTasks();
    });

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Clear all
    clearAllBtn.addEventListener('click', () => {
        if (tasks.length === 0) {
            showToast('No tasks to clear', 'info');
            return;
        }
        showConfirm('Delete all tasks? This cannot be undone.', () => {
            tasks = [];
            saveTasks();
            renderTasks();
            updateStats();
            showToast('All tasks cleared', 'success');
        });
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Confirm modal
    confirmCancel.addEventListener('click', hideConfirm);

    // Edit modal
    editCancel.addEventListener('click', hideEditModal);
    editSave.addEventListener('click', saveEdit);
    editTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit();
    });
}

// ============================================
// Task CRUD Operations
// ============================================

function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showToast('Please enter a task', 'warning');
        taskInput.focus();
        return;
    }

    const task = {
        id: Date.now().toString(),
        text: text,
        priority: taskPriority.value,
        category: taskCategory.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();

    // Reset inputs
    taskInput.value = '';
    taskInput.focus();

    showToast('Task added successfully', 'success');
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
        showToast(
            task.completed ? 'Task completed! 🎉' : 'Task marked as pending',
            task.completed ? 'success' : 'info'
        );
    }
}

function deleteTask(id) {
    showConfirm('Are you sure you want to delete this task?', () => {
        const taskEl = document.querySelector(`[data-id="${id}"]`);
        if (taskEl) {
            taskEl.classList.add('removing');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
                updateStats();
                showToast('Task deleted', 'error');
            }, 300);
        }
    });
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    editTaskInput.value = task.text;
    editPriority.value = task.priority;
    editCategory.value = task.category;
    editModal.classList.remove('hidden');
    editTaskInput.focus();
}

function hideEditModal() {
    editModal.classList.add('hidden');
    editingTaskId = null;
}

function saveEdit() {
    const text = editTaskInput.value.trim();
    if (!text) {
        showToast('Task name cannot be empty', 'warning');
        return;
    }

    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        task.text = text;
        task.priority = editPriority.value;
        task.category = editCategory.value;
        saveTasks();
        renderTasks();
        updateStats();
        showToast('Task updated', 'info');
    }

    hideEditModal();
}

// ============================================
// Rendering
// ============================================

function renderTasks() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        taskList.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        taskList.style.display = 'flex';

        filtered.forEach(task => {
            const li = createTaskElement(task);
            taskList.appendChild(li);
        });
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };
    const categoryLabels = {
        personal: '👤 Personal',
        work: '💼 Work',
        study: '📚 Study',
        shopping: '🛒 Shopping',
        health: '💪 Health',
        others: '📌 Others'
    };

    li.innerHTML = `
        <div class="task-checkbox" onclick="toggleComplete('${task.id}')">
            ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-meta">
                <span class="badge badge-${task.priority}">${priorityLabels[task.priority]}</span>
                <span class="badge badge-category">${categoryLabels[task.category]}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-action-btn edit-btn" onclick="openEditModal('${task.id}')" title="Edit">✏️</button>
            <button class="task-action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete">🗑️</button>
        </div>
    `;

    return li;
}

function getFilteredTasks() {
    let filtered = [...tasks];

    // Apply filter
    switch (currentFilter) {
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
        case 'pending':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'high':
            filtered = filtered.filter(t => t.priority === 'high');
            break;
    }

    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(t =>
            t.text.toLowerCase().includes(searchQuery) ||
            t.category.toLowerCase().includes(searchQuery) ||
            t.priority.toLowerCase().includes(searchQuery)
        );
    }

    return filtered;
}

// ============================================
// Statistics
// ============================================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    completionPercentEl.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

// ============================================
// Date & Time
// ============================================

function updateDateTime() {
    const now = new Date();

    // Time
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = String(hours % 12 || 12).padStart(2, '0');
    timeEl.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);

    // Greeting
    let greeting;
    if (hours < 12) greeting = 'Good Morning! ☀️';
    else if (hours < 17) greeting = 'Good Afternoon! 🌤️';
    else greeting = 'Good Evening! 🌙';
    greetingEl.textContent = greeting;
}

// ============================================
// Theme Management
// ============================================

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
    showToast(`Switched to ${next} mode`, 'info');
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================
// Local Storage
// ============================================

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        tasks = data ? JSON.parse(data) : [];
    } catch (e) {
        tasks = [];
    }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Confirmation Modal
// ============================================

let confirmCallback = null;

function showConfirm(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmModal.classList.remove('hidden');
}

function hideConfirm() {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
}

confirmOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
});

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Make functions globally accessible
// ============================================

window.toggleComplete = toggleComplete;
window.deleteTask = deleteTask;
window.openEditModal = openEditModal;

// ============================================
// Start the App
// ============================================

document.addEventListener('DOMContentLoaded', init);