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

function showToast(message, type) {
    type = type || "success";
    var container = document.getElementById("glToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "glToastContainer";
        container.className = "toast-container-custom";
        document.body.appendChild(container);
    }

    var icon = "bi-check-circle-fill text-success";
    if (type === "danger") icon = "bi-exclamation-circle-fill text-danger";
    else if (type === "info") icon = "bi-info-circle-fill text-info";
    else if (type === "warning") icon = "bi-exclamation-triangle-fill text-warning";

    var toast = document.createElement("div");
    toast.className = "gl-toast toast-" + type;
    toast.innerHTML = '<i class="bi ' + icon + ' fs-5"></i><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
        toast.classList.add("show");
    }, 10);

    setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3200);
}

function setBtnLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add("btn-loading");
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> ' + (loadingText || "Processing...");
    } else {
        btn.disabled = false;
        btn.classList.remove("btn-loading");
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
        }
    }
}
