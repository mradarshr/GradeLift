function getToken() {
    return localStorage.getItem("gradelift_token");
}

function setToken(token) {
    localStorage.setItem("gradelift_token", token);
}

function clearAuth() {
    localStorage.removeItem("gradelift_token");
    localStorage.removeItem("gradelift_user");
    sessionStorage.clear();
}

async function apiRequest(endpoint, method, body) {
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }
    var options = {
        method: method || "GET",
        headers: headers
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    var res = await fetch(endpoint, options);
    if (res.status === 401) {
        clearAuth();
        window.location.href = "login.html";
        return null;
    }
    var data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

async function checkLogin() {
    var token = getToken();
    if (!token && !sessionStorage.getItem("loggedIn")) {
        window.location.href = "login.html";
        return;
    }
    try {
        var res = await apiRequest("/api/auth/me");
        if (res && res.user) {
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("userName", res.user.name);
            localStorage.setItem("gradelift_user", JSON.stringify(res.user));
        }
    } catch (e) {
        clearAuth();
        window.location.href = "login.html";
    }
}

async function logout() {
    try {
        await apiRequest("/api/auth/logout", "POST");
    } catch (e) {
    }
    clearAuth();
    window.location.href = "login.html";
}

function getUser() {
    var userJson = localStorage.getItem("gradelift_user");
    if (userJson) {
        try {
            var u = JSON.parse(userJson);
            if (u && u.name) return u.name;
        } catch (e) {
        }
    }
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
