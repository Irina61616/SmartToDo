const STORAGE_KEY = 'smartTodo_tasks';

const quotes = [
    "Маленькие шаги каждый день приводят к большим результатам",
    "Лучшее время начать — сейчас",
    "Делай сегодня то, что другие не хотят, завтра будешь жить так, как другие не могут",
    "Каждая завершенная задача приближает вас к цели",
    "Прогресс — это движение, даже если оно маленькое",
    "Дисциплина решает то, что мотивация не может",
    "Одна задача за раз — путь к успеху",
    "Ваша зона комфорта — враг ваших достижений"
];

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }


    loadTasks() {
        const tasks = localStorage.getItem(STORAGE_KEY);
        return tasks ? JSON.parse(tasks) : [];
    }

 
    saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
        this.updateStats();
        this.renderTasks();
    }

    addTask(title, priority) {
        if (!title.trim()) return false;

        const task = {
            id: Date.now(),
            title: title.trim(),
            priority: priority,
            completed: false,
            createdAt: new Date().toLocaleString('ru-RU'),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveTasks();
        this.showNotification('Задача добавлена!', 'success');
        return true;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.showNotification('Задача удалена', 'info');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString('ru-RU') : null;
            this.saveTasks();
            
            if (task.completed) {
                this.showNotification('Задача выполнена! 🎉', 'success');
                this.confetti();
            }
        }
    }

    editTask(id, newTitle, newPriority) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newTitle.trim()) {
            task.title = newTitle.trim();
            task.priority = newPriority;
            this.saveTasks();
            this.showNotification('Задача обновлена', 'success');
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('Нет выполненных задач', 'info');
            return;
        }

        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.showNotification(`Очищено ${completedCount} задач`, 'success');
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
        }

        if (this.searchQuery) {
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        return filtered.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Задач пока нет</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
        this.attachTaskEvents();
    }

    createTaskElement(task) {
        const priorityText = {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий'
        };

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">
                            ${priorityText[task.priority]}
                        </span>
                        <span class="task-date">
                            <i class="far fa-calendar-alt"></i>
                            ${task.createdAt}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="taskManager.editTaskPrompt(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="taskManager.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachTaskEvents() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                this.toggleTask(taskId);
            });
        });
    }

    editTaskPrompt(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newTitle = prompt('Редактировать задачу:', task.title);
        if (newTitle === null) return;

        const newPriority = prompt('Изменить приоритет (low/medium/high):', task.priority);
        if (newPriority && ['low', 'medium', 'high'].includes(newPriority)) {
            this.editTask(id, newTitle, newPriority);
        } else if (newPriority) {
            alert('Некорректный приоритет. Используйте: low, medium, high');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    confetti() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.innerHTML = '🎉';
                confetti.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: -50px;
                    font-size: ${Math.random() * 30 + 20}px;
                    animation: confetti ${Math.random() * 2 + 2}s linear;
                    z-index: 9999;
                `;
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 200);
        }
    }

    updateQuote() {
        const quoteEl = document.getElementById('random-quote');
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteEl.textContent = quotes[randomIndex];
    }

    init() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes confetti {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('task-input');
            const priority = document.getElementById('task-priority');
            
            if (this.addTask(input.value, priority.value)) {
                input.value = '';
            }
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderTasks();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        document.getElementById('clear-completed-btn').addEventListener('click', () => {
            this.clearCompleted();
        });

        this.updateQuote();
        setInterval(() => this.updateQuote(), 10000);

        this.renderTasks();
    }
}

const taskManager = new TaskManager();