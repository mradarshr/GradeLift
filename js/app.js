async function loadData(jsonFile, storageKey) {
    var saved = localStorage.getItem(storageKey);
    if (saved) {
        return JSON.parse(saved);
    }
    var response = await fetch(jsonFile);
    var data = await response.json();
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
}

function saveData(storageKey, data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
}

function checkLogin() {
    if (!sessionStorage.getItem("loggedIn")) {
        window.location.href = "login.html";
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

function getUser() {
    return sessionStorage.getItem("userName") || "Student";
}

function toggleSidebar() {
    var sidebar = document.querySelector(".sidebar");
    var overlay = document.querySelector(".sidebar-overlay");
    if (sidebar) {
        sidebar.classList.toggle("show");
    }
    if (overlay) {
        overlay.classList.toggle("show");
    }
}

