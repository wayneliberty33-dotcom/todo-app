"use strict";

/* =========================================================
   TASKFLOW
   ========================================================= */

const STORAGE_KEY = "taskflow_tasks";
const THEME_KEY = "taskflow_theme";

let tasks = [];
let currentFilter = "all";
let taskToDelete = null;


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  tasks = loadTasks();

  initializeTheme();

  setupEvents();

  render();

});


/* =========================================================
   GET ELEMENT
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

  /* Add Task */

  $("openAddTask").addEventListener("click", function () {
    openTaskModal();
  });


  $("emptyAddTask").addEventListener("click", function () {
    openTaskModal();
  });


  /* Task modal */

  $("closeModal").addEventListener("click", function () {
    closeTaskModal();
  });


  $("cancelModal").addEventListener("click", function () {
    closeTaskModal();
  });


  $("taskModal").addEventListener("click", function (event) {

    if (event.target === $("taskModal")) {
      closeTaskModal();
    }

  });


  /* Delete modal */

  $("cancelDelete").addEventListener("click", function () {
    closeDeleteModal();
  });


  $("confirmDelete").addEventListener("click", function () {
    confirmTaskDeletion();
  });


  $("deleteModal").addEventListener("click", function (event) {

    if (event.target === $("deleteModal")) {
      closeDeleteModal();
    }

  });


  /* Form */

  $("taskForm").addEventListener("submit", function (event) {
    handleTaskSubmit(event);
  });


  /* Search */

  $("searchInput").addEventListener("input", function () {
    render();
  });


  /* Filters */

  $("priorityFilter").addEventListener("change", function () {
    render();
  });


  $("categoryFilter").addEventListener("change", function () {
    render();
  });


  /* Sidebar navigation */

  document.querySelectorAll(".nav-item").forEach(function (button) {

    button.addEventListener("click", function () {

      currentFilter = button.dataset.filter;

      document
        .querySelectorAll(".nav-item")
        .forEach(function (item) {
          item.classList.remove("active");
        });

      button.classList.add("active");

      render();

    });

  });


  /* Clear completed */

  $("clearCompleted").addEventListener("click", function () {
    clearCompletedTasks();
  });


  /* Theme */

  $("themeToggle").addEventListener("click", function () {
    toggleTheme();
  });


  /* Keyboard */

  document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

      if (!$("taskModal").classList.contains("hidden")) {
        closeTaskModal();
      }

      if (!$("deleteModal").classList.contains("hidden")) {
        closeDeleteModal();
      }

    }


    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      $("searchInput").focus();

    }

  });

}


/* =========================================================
   OPEN ADD / EDIT MODAL
   ========================================================= */

function openTaskModal(task) {

  $("taskForm").reset();

  if (task) {

    $("modalTitle").textContent = "Edit task";

    $("taskId").value = task.id;

    $("taskTitle").value = task.title || "";

    $("taskDescription").value = task.notes || "";

    $("taskDueDate").value = task.dueDate || "";

    $("taskPriority").value =
      task.priority || "medium";

    $("taskCategory").value =
      task.category || "";

  } else {

    $("modalTitle").textContent = "Create a task";

    $("taskId").value = "";

    $("taskPriority").value = "medium";

  }


  $("taskModal").classList.remove("hidden");

  $("taskModal").setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(function () {
    $("taskTitle").focus();
  }, 100);

}


/* =========================================================
   CLOSE TASK MODAL
   ========================================================= */

function closeTaskModal() {

  $("taskModal").classList.add("hidden");

  $("taskModal").setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   SAVE TASK
   ========================================================= */

function handleTaskSubmit(event) {

  event.preventDefault();

  const title =
    $("taskTitle").value.trim();

  if (!title) {

    $("taskTitle").focus();

    return;

  }


  const id =
    $("taskId").value;


  const taskData = {

    title: title,

    notes:
      $("taskDescription").value.trim(),

    dueDate:
      $("taskDueDate").value,

    priority:
      $("taskPriority").value,

    category:
      $("taskCategory").value.trim()

  };


  /* EDIT */

  if (id) {

    const index =
      tasks.findIndex(function (task) {
        return task.id === id;
      });


    if (index !== -1) {

      tasks[index] = {
        ...tasks[index],
        ...taskData,
        updatedAt: Date.now()
      };

    }

  }


  /* CREATE */

  else {

    const newTask = {

      id: generateId(),

      title: taskData.title,

      notes: taskData.notes,

      dueDate: taskData.dueDate,

      priority: taskData.priority,

      category: taskData.category,

      completed: false,

      createdAt: Date.now(),

      updatedAt: Date.now()

    };


    tasks.unshift(newTask);

  }


  saveTasks();

  closeTaskModal();

  render();

}


/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(id) {

  taskToDelete = id;

  $("deleteModal").classList.remove("hidden");

  $("deleteModal").setAttribute(
    "aria-hidden",
    "false"
  );

}


function confirmTaskDeletion() {

  if (!taskToDelete) {
    return;
  }


  tasks = tasks.filter(function (task) {
    return task.id !== taskToDelete;
  });


  saveTasks();

  closeDeleteModal();

  render();

}


function closeDeleteModal() {

  taskToDelete = null;

  $("deleteModal").classList.add("hidden");

  $("deleteModal").setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   COMPLETE TASK
   ========================================================= */

function toggleTask(id) {

  const task =
    tasks.find(function (item) {
      return item.id === id;
    });


  if (!task) {
    return;
  }


  task.completed = !task.completed;

  task.updatedAt = Date.now();

  saveTasks();

  render();

}


/* =========================================================
   EDIT TASK
   ========================================================= */

function editTask(id) {

  const task =
    tasks.find(function (item) {
      return item.id === id;
    });


  if (!task) {
    return;
  }


  openTaskModal(task);

}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  updateStatistics();

  updateCategoryFilter();

  updatePageTitle();

  const visibleTasks =
    getVisibleTasks();

  renderTasks(visibleTasks);

  updateEmptyState(visibleTasks);

  updateSummary(visibleTasks);

}


/* =========================================================
   FILTER
   ========================================================= */

function getVisibleTasks() {

  const search =
    $("searchInput")
      .value
      .trim()
      .toLowerCase();


  const priority =
    $("priorityFilter").value;


  const category =
    $("categoryFilter").value;


  return tasks
    .filter(function (task) {

      if (
        currentFilter === "active" &&
        task.completed
      ) {
        return false;
      }


      if (
        currentFilter === "completed" &&
        !task.completed
      ) {
        return false;
      }


      if (
        currentFilter === "overdue" &&
        !isOverdue(task)
      ) {
        return false;
      }


      if (search) {

        const text = [
          task.title,
          task.notes,
          task.category
        ]
          .join(" ")
          .toLowerCase();


        if (!text.includes(search)) {
          return false;
        }

      }


      if (
        priority !== "all" &&
        task.priority !== priority
      ) {
        return false;
      }


      if (
        category !== "all" &&
        task.category !== category
      ) {
        return false;
      }


      return true;

    })


    .sort(function (a, b) {

      if (a.completed !== b.completed) {

        return a.completed ? 1 : -1;

      }


      if (a.dueDate && b.dueDate) {

        return a.dueDate.localeCompare(
          b.dueDate
        );

      }


      if (a.dueDate) {
        return -1;
      }


      if (b.dueDate) {
        return 1;
      }


      return b.createdAt - a.createdAt;

    });

}


/* =========================================================
   RENDER TASK CARDS
   ========================================================= */

function renderTasks(list) {

  $("taskList").innerHTML = "";


  list.forEach(function (task) {

    const card =
      document.createElement("article");


    card.className =
      "task-card" +
      (task.completed ? " completed" : "");


    let categoryHTML = "";


    if (task.category) {

      categoryHTML = `
        <span class="badge category-badge">
          ${escapeHTML(task.category)}
        </span>
      `;

    }


    const dueHTML =
      createDueDateHTML(task);


    card.innerHTML = `

      <button
        class="check-button"
        type="button"
        aria-label="${
          task.completed
            ? "Mark task as active"
            : "Mark task as complete"
        }"
      >
        ${task.completed ? "✓" : ""}
      </button>


      <div class="task-content">

        <h4 class="task-title">
          ${escapeHTML(task.title)}
        </h4>


        ${
          task.notes
            ? `
              <p class="task-notes">
                ${escapeHTML(task.notes)}
              </p>
            `
            : ""
        }


        <div class="task-meta">

          <span class="badge priority-${escapeHTML(
            task.priority || "medium"
          )}">
            ${escapeHTML(
              task.priority || "medium"
            )}
          </span>

          ${categoryHTML}

          ${dueHTML}

        </div>

      </div>


      <div class="task-actions">

        <button
          class="icon-button edit-button"
          type="button"
          title="Edit task"
          aria-label="Edit task"
        >
          ✎
        </button>

        <button
          class="icon-button delete delete-button"
          type="button"
          title="Delete task"
          aria-label="Delete task"
        >
          ×
        </button>

      </div>

    `;


    card
      .querySelector(".check-button")
      .addEventListener("click", function () {
        toggleTask(task.id);
      });


    card
      .querySelector(".edit-button")
      .addEventListener("click", function () {
        editTask(task.id);
      });


    card
      .querySelector(".delete-button")
      .addEventListener("click", function () {
        deleteTask(task.id);
      });


    $("taskList").appendChild(card);

  });

}


/* =========================================================
   DUE DATE
   ========================================================= */

function createDueDateHTML(task) {

  if (!task.dueDate) {
    return "";
  }


  const status =
    getDueDateStatus(task);


  let className = "due-date";

  let label =
    formatDate(task.dueDate);


  if (status === "overdue") {

    className += " overdue";

    label =
      "Overdue · " +
      formatDate(task.dueDate);

  }


  if (status === "today") {

    className += " today";

    label = "Due today";

  }


  if (status === "tomorrow") {

    label = "Due tomorrow";

  }


  return `
    <span class="${className}">
      ◷ ${escapeHTML(label)}
    </span>
  `;

}


/* =========================================================
   DATE FUNCTIONS
   ========================================================= */

function getDueDateStatus(task) {

  if (!task.dueDate || task.completed) {
    return "normal";
  }


  const today =
    startOfToday();


  const due =
    parseDate(task.dueDate);


  const difference =
    Math.round(
      (due - today) /
      (1000 * 60 * 60 * 24)
    );


  if (difference < 0) {
    return "overdue";
  }


  if (difference === 0) {
    return "today";
  }


  if (difference === 1) {
    return "tomorrow";
  }


  return "normal";

}


function isOverdue(task) {

  return (
    !task.completed &&
    Boolean(task.dueDate) &&
    getDueDateStatus(task) === "overdue"
  );

}


function startOfToday() {

  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;

}


function parseDate(value) {

  const parts =
    value.split("-").map(Number);


  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  );

}


function formatDate(value) {

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  ).format(parseDate(value));

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

  const total =
    tasks.length;


  const completed =
    tasks.filter(function (task) {
      return task.completed;
    }).length;


  const active =
    total - completed;


  const overdue =
    tasks.filter(function (task) {
      return isOverdue(task);
    }).length;


  $("totalStat").textContent = total;

  $("activeStat").textContent = active;

  $("completedStat").textContent = completed;

  $("overdueStat").textContent = overdue;

  $("allCount").textContent = total;

  $("activeCount").textContent = active;

  $("completedCount").textContent = completed;

  $("overdueCount").textContent = overdue;

}


/* =========================================================
   CATEGORIES
   ========================================================= */

function updateCategoryFilter() {

  const select =
    $("categoryFilter");


  const current =
    select.value;


  const categories = [
    ...new Set(
      tasks
        .map(function (task) {
          return task.category;
        })
        .filter(Boolean)
    )
  ].sort(function (a, b) {
    return a.localeCompare(b);
  });


  select.innerHTML = `
    <option value="all">
      All categories
    </option>
  `;


  categories.forEach(function (category) {

    const option =
      document.createElement("option");


    option.value = category;

    option.textContent = category;


    select.appendChild(option);

  });


  if (categories.includes(current)) {

    select.value = current;

  }

}


/* =========================================================
   PAGE TITLE
   ========================================================= */

function updatePageTitle() {

  const titles = {
    all: "All Tasks",
    active: "Active Tasks",
    completed: "Completed Tasks",
    overdue: "Overdue Tasks"
  };


  $("pageTitle").textContent =
    titles[currentFilter] || "All Tasks";

}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(list) {

  const count = list.length;


  $("taskSummary").textContent =
    count +
    (count === 1 ? " task" : " tasks");

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function updateEmptyState(list) {

  if (list.length > 0) {

    $("emptyState").classList.add("hidden");

    $("taskList").classList.remove("hidden");

    return;

  }


  $("taskList").classList.add("hidden");

  $("emptyState").classList.remove("hidden");


  if (tasks.length === 0) {

    $("emptyTitle").textContent =
      "No tasks yet";

    $("emptyDescription").textContent =
      "Create your first task and start getting organized.";

    $("emptyAddTask").classList.remove("hidden");

    return;

  }


  $("emptyAddTask").classList.add("hidden");


  if ($("searchInput").value.trim()) {

    $("emptyTitle").textContent =
      "No matching tasks";

    $("emptyDescription").textContent =
      "Try a different search term or clear your filters.";

  } else {

    $("emptyTitle").textContent =
      "Nothing here";

    $("emptyDescription").textContent =
      "There are no tasks matching the current filters.";

  }

}


/* =========================================================
   CLEAR COMPLETED
   ========================================================= */

function clearCompletedTasks() {

  const completed =
    tasks.filter(function (task) {
      return task.completed;
    });


  if (completed.length === 0) {
    return;
  }


  const confirmed =
    window.confirm(
      "Delete " +
      completed.length +
      " completed task" +
      (completed.length === 1 ? "" : "s") +
      "?"
    );


  if (!confirmed) {
    return;
  }


  tasks =
    tasks.filter(function (task) {
      return !task.completed;
    });


  saveTasks();

  render();

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadTasks() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(saved);


    if (!Array.isArray(parsed)) {
      return [];
    }


    return parsed;

  } catch (error) {

    console.error(
      "TaskFlow could not load saved tasks:",
      error
    );

    return [];

  }

}


function saveTasks() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );

  } catch (error) {

    console.error(
      "TaskFlow could not save tasks:",
      error
    );

  }

}


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {

  let saved = null;


  try {
    saved =
      localStorage.getItem(THEME_KEY);
  } catch (error) {
    saved = null;
  }


  if (saved === "dark") {

    document.body.classList.add("dark");

  }


  else if (saved === "light") {

    document.body.classList.remove("dark");

  }


  else if (
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
  ) {

    document.body.classList.add("dark");

  }


  updateThemeButton();

}


function toggleTheme() {

  const isDark =
    document.body.classList.toggle("dark");


  try {

    localStorage.setItem(
      THEME_KEY,
      isDark ? "dark" : "light"
    );

  } catch (error) {
    /* Ignore storage errors */
  }


  updateThemeButton();

}


function updateThemeButton() {

  const isDark =
    document.body.classList.contains("dark");


  $("themeIcon").textContent =
    isDark ? "☀" : "☾";


  $("themeText").textContent =
    isDark ? "Light mode" : "Dark mode";

}


/* =========================================================
   ID
   ========================================================= */

function generateId() {

  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );

}


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
